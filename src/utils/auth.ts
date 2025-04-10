/**
 * Функции для работы с авторизацией
 */

const TOKEN_KEY = 'auth_token';

/**
 * Получает токен из localStorage
 */
export const getToken = (): string | null => {
	return localStorage.getItem(TOKEN_KEY);
};

/**
 * Сохраняет токен в localStorage
 */
export const setToken = (token: string): void => {
	localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Удаляет токен из localStorage
 */
export const removeToken = (): void => {
	localStorage.removeItem(TOKEN_KEY);
};

/**
 * Проверяет, авторизован ли пользователь
 */
export const isAuthenticated = (): boolean => {
	return !!getToken();
};
