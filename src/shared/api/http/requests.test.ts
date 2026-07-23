import Cookies from 'js-cookie';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {registerApiErrorCodeHandler, registerAuthClearedHandler} from '@/shared/api/http/interceptors';
import {POST} from '@/shared/api/http/requests';
import {ModalStore} from '@/shared/model/ModalStore';
import {NotificationStore} from '@/shared/model/NotificationStore';

vi.mock('js-cookie', () => ({
	default: {
		get: vi.fn(),
		set: vi.fn(),
		remove: vi.fn(),
	},
}));

vi.mock('@/shared/model/ModalStore', () => ({
	ModalStore: {
		setWindow: vi.fn(),
		setIsOpen: vi.fn(),
	},
}));

vi.mock('@/shared/model/NotificationStore', () => ({
	NotificationStore: {
		addNotification: vi.fn(),
	},
}));

/** Строит объект, похожий на fetch Response, достаточный для веток кода requests.ts */
const makeResponse = (status: number, body: unknown, ok = status >= 200 && status < 300) => ({
	ok,
	status,
	headers: {get: () => 'application/json'},
	json: async () => body,
});

describe('GET/POST/PUT/DELETE (fetchData branches)', () => {
	// Cookies.get перегружен (без аргументов возвращает объект, с именем — строку),
	// vi.mocked() из-за этого путает сигнатуру мока — типизируем явно как простую функцию.
	const mockedCookies = Cookies as unknown as {
		get: ReturnType<typeof vi.fn<[key?: string], string | undefined>>;
		set: ReturnType<typeof vi.fn>;
		remove: ReturnType<typeof vi.fn>;
	};
	const mockedModalStore = vi.mocked(ModalStore);
	const mockedNotificationStore = vi.mocked(NotificationStore);

	beforeEach(() => {
		vi.clearAllMocks();
		mockedCookies.get.mockReturnValue(undefined);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('401 without is_authenticated cookie clears auth state and opens login modal for auth requests', async () => {
		const authClearedHandler = vi.fn();
		const unregister = registerAuthClearedHandler(authClearedHandler);

		const fetchMock = vi.fn().mockResolvedValueOnce(makeResponse(401, {detail: 'Учётные данные не были предоставлены.'}));
		vi.stubGlobal('fetch', fetchMock);

		const result = await POST('some-endpoint', {auth: true});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(authClearedHandler).toHaveBeenCalledTimes(1);
		expect(mockedCookies.remove).toHaveBeenCalledWith('is_authenticated');
		expect(mockedModalStore.setWindow).toHaveBeenCalledWith('login');
		expect(mockedModalStore.setIsOpen).toHaveBeenCalledWith(true);
		expect(result.success).toBe(false);

		unregister();
	});

	it('retries once after refreshing CSRF token on a 403 CSRF error, then succeeds', async () => {
		mockedCookies.get.mockImplementation((key?: string) => (key === 'csrftoken' ? 'stale-token' : undefined));

		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(makeResponse(403, {detail: 'CSRF Failed: CSRF token missing.'}))
			.mockResolvedValueOnce(makeResponse(200, {}))
			.mockResolvedValueOnce(makeResponse(200, {result: 'ok'}));
		vi.stubGlobal('fetch', fetchMock);

		const result = await POST('some-endpoint', {body: {foo: 'bar'}});

		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[1][0]).toBe('/api/categories/');
		expect(result).toEqual({success: true, data: {result: 'ok'}});
	});

	it('delegates to a registered API error code handler and skips the default error notification', async () => {
		const handler = vi.fn().mockReturnValue(true);
		const unregister = registerApiErrorCodeHandler(handler);

		const fetchMock = vi.fn().mockResolvedValueOnce(makeResponse(400, {code: 'SOME_CODE', error: 'Специфическая ошибка'}));
		vi.stubGlobal('fetch', fetchMock);

		const result = await POST('some-endpoint', {});

		expect(handler).toHaveBeenCalledWith('SOME_CODE', {code: 'SOME_CODE', error: 'Специфическая ошибка'});
		expect(mockedNotificationStore.addNotification).not.toHaveBeenCalled();
		expect(result).toEqual({success: false, errors: 'Специфическая ошибка', code: 'SOME_CODE'});

		unregister();
	});
});
