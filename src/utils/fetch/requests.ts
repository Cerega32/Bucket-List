import Cookies from 'js-cookie';

import {ModalStore} from '@/store/ModalStore';
import {INotification, NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {withRetry} from '@/utils/api/apiRetry';

/** Получить CSRF-токен из cookie (Django: csrftoken) */
const getCsrfToken = (): string | undefined => {
	return Cookies.get('csrftoken') || undefined;
};

/** Обновить CSRF cookie — GET-запрос заставит Django установить актуальный токен (публичный endpoint) */
const refreshCsrfToken = async (): Promise<void> => {
	await fetch('/api/categories/', {method: 'GET', credentials: 'include'});
};

/** Привести фронт в «незалогиненное» состояние: снять JS-видимые auth-cookies и сбросить MobX-стор.
 * httpOnly cookie 'token' снимает сервер (middleware при 401 / logout view) — из JS её не достать. */
const clearAuthState = (): void => {
	Cookies.remove('is_authenticated');
	Cookies.remove('avatar');
	Cookies.remove('name');
	Cookies.remove('user-id');
	Cookies.remove('subscription_type');
	Cookies.remove('user_level');
	Cookies.remove('user_total_completed_goals');
	Cookies.remove('email_confirmed');
	UserStore.setIsAuth(false);
	UserStore.setAvatar('');
	UserStore.setName('');
};

export interface IRequestGet {
	[key: string]: string | number | boolean | undefined;
}

interface IFetchParams {
	auth?: boolean;
	get?: IRequestGet;
	file?: boolean;
	body?: string | FormData | Record<string, any>;
	success?: Omit<INotification, 'id'>;
	error?: Omit<INotification, 'id'>;
	showErrorNotification?: boolean;
	showSuccessNotification?: boolean;
	enableRetry?: boolean;
}

const setHeaders = (method: string, params: IFetchParams = {}): HeadersInit => {
	const headers: Record<string, string> = {};
	// Токен живёт в httpOnly cookie и отправляется автоматически через credentials: 'include'.
	// Authorization-заголовок больше не формируем из JS — токен JS-коду недоступен.

	if (!params?.file) {
		headers['Content-Type'] = 'application/json';
	}

	// CSRF-токен для POST/PUT/PATCH/DELETE (Django)
	const csrfToken = getCsrfToken();
	if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
		headers['X-CSRFToken'] = csrfToken;
	}

	return headers;
};

const fetchData = async (url: string, method: string, params: IFetchParams = {}): Promise<any> => {
	const {showErrorNotification = true, showSuccessNotification = false, enableRetry = false} = params;

	const makeRequest = async (isRetryAfterCsrfRefresh = false): Promise<any> => {
		const headers = setHeaders(method, params);

		try {
			const response = await fetch(`/api/${url}/`, {
				method,
				headers,
				credentials: 'include',
				body: params.body ? (params.file ? (params.body as FormData) : JSON.stringify(params.body)) : undefined,
			});

			const contentType = response.headers.get('content-type');
			let data: any = null;
			if (response.status !== 204 && response.status !== 205) {
				if (contentType?.includes('application/json')) {
					data = await response.json();
				} else {
					throw new Error(`Server returned non-JSON. Status: ${response.status}`);
				}
			}

			if (!response.ok) {
				const isCsrfError =
					response.status === 403 && (typeof data?.detail === 'string' ? data.detail : '').toLowerCase().includes('csrf');

				// 403 CSRF — пробуем обновить токен и повторить один раз
				if (isCsrfError && !isRetryAfterCsrfRefresh) {
					await refreshCsrfToken();
					return await makeRequest(true);
				}

				// Повтор не помог — очищаем авторизацию, чтобы не было рассинхрона (модалка логина + «вы авторизованы»)
				if (isCsrfError && isRetryAfterCsrfRefresh) {
					clearAuthState();
				}
				if (response.status === 401) {
					// Сервер через ClearStaleAuthCookieMiddleware сам снимает auth-cookies, если токен
					// был протухший. Здесь подтягиваем MobX-стор к реальности — только когда маркер
					// действительно пропал, чтобы не разлогинить пользователя с валидной сессией
					// (например, опечатка в пароле при открытой форме логина в другой вкладке).
					if (!Cookies.get('is_authenticated')) {
						clearAuthState();
					}
					if (params.auth) {
						ModalStore.setWindow('login');
						ModalStore.setIsOpen(true);
					}
					return {
						success: false,
						errors: data?.detail || data?.error,
					};
				}
				if (response.status === 429 && enableRetry) {
					return {
						success: false,
						errors: {
							...data,
							retry_after: data.retry_after || 1,
							api_name: data.api_name || 'API',
						},
					};
				}

				if (showErrorNotification) {
					if (params?.error) {
						NotificationStore.addNotification(params.error);
					} else {
						const message =
							response.status === 403 && (typeof data?.detail === 'string' ? data.detail : '').toLowerCase().includes('csrf')
								? 'Сессия истекла. Обновите страницу и попробуйте снова.'
								: data.error || 'Что-то пошло не так';
						NotificationStore.addNotification({
							type: 'error',
							title: 'Ошибка',
							message,
						});
					}
				}

				return {
					success: false,
					errors: data?.detail || data?.error || data.error,
				};
			}

			if (showSuccessNotification) {
				if (params?.success) {
					NotificationStore.addNotification(params.success);
				} else {
					NotificationStore.addNotification({
						type: 'success',
						title: 'Успешно',
					});
				}
			}

			return {
				success: true,
				data,
			};
		} catch (error) {
			if (showErrorNotification) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка сервера',
					message: error instanceof Error ? error.message : 'Что-то пошло не так',
				});
			}
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Ошибка при выполнении запроса',
			};
		}
	};

	if (enableRetry) {
		return withRetry(makeRequest);
	}
	return makeRequest();
};

export const POST = (url: string, params: IFetchParams): Promise<any> => fetchData(url, 'POST', params);

export const POST_WITH_RETRY = (url: string, params: IFetchParams): Promise<any> => fetchData(url, 'POST', {...params, enableRetry: true});

export const DELETE = (url: string, params: IFetchParams): Promise<any> => fetchData(url, 'DELETE', params);

export const GET = async (url: string, params?: IFetchParams): Promise<any> => {
	let queryString = '';

	if (params?.get) {
		const filteredParams = Object.entries(params.get)
			.filter(([_, value]) => value !== undefined && value !== null)
			.reduce(
				(result, [key, value]) => ({
					...result,
					[key]: String(value),
				}),
				{} as Record<string, string>
			);

		const urlSearchParams = new URLSearchParams(filteredParams);
		queryString = urlSearchParams.toString();
	}

	try {
		const response = await fetch(`/api/${url}/${queryString ? `?${queryString}` : ''}`, {
			headers: setHeaders('GET', params || {}),
			credentials: 'include',
		});

		// Проверяем Content-Type перед парсингом JSON
		const contentType = response.headers.get('content-type');
		let data;

		if (contentType && contentType.includes('application/json')) {
			data = await response.json();
		} else {
			// Если пришел не JSON, читаем как текст для отладки
			const text = await response.text();
			console.error('Non-JSON response received:', text.substring(0, 500));
			throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
		}

		if (!response.ok) {
			return {
				success: false,
				errors: data.error || data.errors || 'Ошибка сервера',
			};
		}

		return {
			success: true,
			data,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Ошибка при выполнении запроса',
		};
	}
};

export const PUT = (url: string, params: IFetchParams): Promise<any> => fetchData(url, 'PUT', params);

export const getGoogleBooksVolumeDetails = async (volumeId: string): Promise<any> => {
	try {
		const response = await fetch(`/api/goals/google-books/${volumeId}/details/`, {
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				success: false,
				error: data.error || 'Ошибка получения детальной информации',
			};
		}

		return {
			success: true,
			data,
		};
	} catch (error) {
		return {
			success: false,
			error: 'Ошибка сети при получении детальной информации',
		};
	}
};
