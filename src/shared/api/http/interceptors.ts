/** Инверсия зависимостей HTTP-клиента: вместо прямого импорта сущностей/фич,
 * requests.ts дёргает зарегистрированные хендлеры. Регистрация — на стороне app/. */

type AuthClearedHandler = () => void;

/** Возвращает true, если код обработан (показан свой toast/эффект вместо общей ошибки) */
type ApiErrorCodeHandler = (code: string, payload: unknown) => boolean;

let authClearedHandler: AuthClearedHandler | null = null;
const apiErrorCodeHandlers: ApiErrorCodeHandler[] = [];

export const registerAuthClearedHandler = (handler: AuthClearedHandler): (() => void) => {
	authClearedHandler = handler;
	return () => {
		if (authClearedHandler === handler) {
			authClearedHandler = null;
		}
	};
};

/** Вызывается requests.ts при потере авторизации (протухший токен, неустранимая CSRF-ошибка) */
export const notifyAuthCleared = (): void => {
	authClearedHandler?.();
};

export const registerApiErrorCodeHandler = (handler: ApiErrorCodeHandler): (() => void) => {
	apiErrorCodeHandlers.push(handler);
	return () => {
		const index = apiErrorCodeHandlers.indexOf(handler);
		if (index !== -1) {
			apiErrorCodeHandlers.splice(index, 1);
		}
	};
};

/** Возвращает true, если хотя бы один зарегистрированный хендлер обработал код ошибки API */
export const handleApiErrorCode = (code: unknown, payload: unknown): boolean =>
	typeof code === 'string' && apiErrorCodeHandlers.some((handler) => handler(code, payload));
