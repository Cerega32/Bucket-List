import {INotification, NotificationStore} from '@/store/NotificationStore';
import Cookies from 'js-cookie';

interface IRequestGet {
	[key: string]: string | number | boolean;
}

interface IFetchParams {
	auth?: boolean;
	get?: IRequestGet;
	file?: boolean;
	body?: Record<string, any>;
	success?: Omit<INotification, 'id'>;
	error?: Omit<INotification, 'id'>;
}

type Headers = HeadersInit & {
	Authorization?: string;
};

const setHeaders = (params: IFetchParams): Headers => {
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
	const headers = setHeaders(params);

	try {
		const response = await fetch(`/api/${url}/`, {
			method,
			headers,
			body: params.body ? (params.file ? params.body : JSON.stringify(params.body)) : undefined, // Check if body exists before stringifying
		});

		const data = await response.json();

		if (!response.ok) {
			if (params?.error) {
				NotificationStore.addNotification(params.error);
			} else {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: data.error || 'Что-то пошло не так',
				});
			}

			return {
				success: false,
				errors: data.error,
			};
		}

		if (params?.success) {
			NotificationStore.addNotification(params.success);
		} else {
			NotificationStore.addNotification({
				type: 'success',
				title: 'Успешно',
			});
		}
		return {
			success: true,
			data,
		};
	} catch (error) {
		NotificationStore.addNotification({
			type: 'error',
			title: 'Ошибка сервера',
			message: 'Что-то пошло не так',
		});
		return Promise.reject(error);
	}
};

export const POST = (url: string, params: IFetchParams): Promise<any> => fetchData(url, 'POST', params);

export const DELETE = (url: string, params: IFetchParams): Promise<any> => fetchData(url, 'DELETE', params);

export const GET = async (url: string, params?: IFetchParams): Promise<any> => {
	const headers = setHeaders(params);

	let queryString = '';

	if (params?.get) {
		const filteredParams = Object.entries(params.get)
			.filter(([_, value]) => value !== undefined && value !== null)
			.reduce((result, [key, value]) => {
				result[key] = value;
				return result;
			}, {} as Record<string, string | number | boolean>);

		const urlSearchParams = new URLSearchParams(filteredParams);
		queryString = urlSearchParams.toString();
	}

	try {
		const response = await fetch(`/api/${url}${queryString ? `?${queryString}` : ''}`, {
			headers,
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				success: false,
				errors: data.error,
			};
		}

		return {
			success: true,
			data,
		};
	} catch (error) {
		return Promise.reject(error);
	}
};

export const PUT = (url: string, params: IFetchParams): Promise<any> => fetchData(url, 'PUT', params);
