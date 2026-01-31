import Cookies from 'js-cookie';

import { INotification, NotificationStore } from '@/store/NotificationStore';
import { withRetry } from '@/utils/api/apiRetry';

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

type Headers = HeadersInit & {
	Authorization?: string;
};

const setHeaders = (params: IFetchParams = {}): Headers => {
	const headers: Headers = {};
	if (params?.auth && Cookies.get('token')) {
		headers.Authorization = `Token ${Cookies.get('token')}`;
	}

	if (!params?.file) {
		headers['Content-Type'] = 'application/json';
	}

	return headers;
};

const fetchData = async (url: string, method: string, params: IFetchParams = {}): Promise<any> => {
	const {showErrorNotification = true, showSuccessNotification = false, enableRetry = false} = params;

	const makeRequest = async () => {
		const headers = setHeaders(params);

		try {
			const response = await fetch(`/api/${url}/`, {
				method,
				headers,
				body: params.body ? (params.file ? (params.body as FormData) : JSON.stringify(params.body)) : undefined,
			});

			const contentType = response.headers.get('content-type');
			let data;
			if (contentType?.includes('application/json')) {
				data = await response.json();
			} else {
				throw new Error(`Server returned non-JSON. Status: ${response.status}`);
			}

			if (!response.ok) {
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
						NotificationStore.addNotification({
							type: 'error',
							title: 'Ошибка',
							message: data.error || 'Что-то пошло не так',
						});
					}
				}

				return {
					success: false,
					errors: data.error,
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
	const headers = setHeaders(params);

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
			headers,
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

export const getFantLabWorkDetails = async (workId: string): Promise<any> => {
	try {
		const response = await fetch(`/api/goals/fantlab/${workId}/details/`, {
			headers: {
				'Content-Type': 'application/json',
			},
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
