import {describe, expect, it, vi} from 'vitest';

import {
	handleApiErrorCode,
	notifyAuthCleared,
	registerApiErrorCodeHandler,
	registerAuthClearedHandler,
} from '@/shared/api/http/interceptors';

describe('registerAuthClearedHandler / notifyAuthCleared', () => {
	it('calls the registered handler on notifyAuthCleared', () => {
		const handler = vi.fn();
		registerAuthClearedHandler(handler);

		notifyAuthCleared();

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('stops calling the handler after unregistering', () => {
		const handler = vi.fn();
		const unregister = registerAuthClearedHandler(handler);

		unregister();
		notifyAuthCleared();

		expect(handler).not.toHaveBeenCalled();
	});

	it('replaces the previous handler when a new one is registered', () => {
		const firstHandler = vi.fn();
		const secondHandler = vi.fn();

		registerAuthClearedHandler(firstHandler);
		registerAuthClearedHandler(secondHandler);
		notifyAuthCleared();

		expect(firstHandler).not.toHaveBeenCalled();
		expect(secondHandler).toHaveBeenCalledTimes(1);
	});
});

describe('registerApiErrorCodeHandler / handleApiErrorCode', () => {
	it('returns false when code is not a string', () => {
		expect(handleApiErrorCode(undefined, null)).toBe(false);
		expect(handleApiErrorCode(404, null)).toBe(false);
	});

	it('returns false when no handler processes the code', () => {
		const handler = vi.fn().mockReturnValue(false);
		const unregister = registerApiErrorCodeHandler(handler);

		const result = handleApiErrorCode('unknown_code', {foo: 'bar'});

		expect(result).toBe(false);
		expect(handler).toHaveBeenCalledWith('unknown_code', {foo: 'bar'});
		unregister();
	});

	it('returns true when at least one handler processes the code', () => {
		const firstHandler = vi.fn().mockReturnValue(false);
		const secondHandler = vi.fn().mockReturnValue(true);
		const unregisterFirst = registerApiErrorCodeHandler(firstHandler);
		const unregisterSecond = registerApiErrorCodeHandler(secondHandler);

		const result = handleApiErrorCode('handled_code', {foo: 'bar'});

		expect(result).toBe(true);
		expect(firstHandler).toHaveBeenCalledWith('handled_code', {foo: 'bar'});
		expect(secondHandler).toHaveBeenCalledWith('handled_code', {foo: 'bar'});

		unregisterFirst();
		unregisterSecond();
	});

	it('stops calling a handler after it is unregistered', () => {
		const handler = vi.fn().mockReturnValue(true);
		const unregister = registerApiErrorCodeHandler(handler);

		unregister();
		const result = handleApiErrorCode('some_code', {});

		expect(result).toBe(false);
		expect(handler).not.toHaveBeenCalled();
	});
});
