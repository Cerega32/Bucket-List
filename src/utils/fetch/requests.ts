// export const GET = async (url): Promise<> => {
// 	return fetch(url);
// };

import Cookies from 'js-cookie';

interface IPostBody {
	[key: string]: any;
}

export interface IRequestGet {
	[key: string]: string | number | boolean | undefined | null;
}

interface IFetchParams {
	auth?: boolean;
	get?: IRequestGet;
}

type IFetchPostParams = IFetchParams & {
	body?: IPostBody;
};

type Headers = HeadersInit & {
	Authorization?: string;
};

export const POST = async (url: string, params: IFetchPostParams): Promise<any> => {
	const headers: Headers = {'Content-Type': 'application/json'};
	if (params.auth && Cookies.get('token')) {
		headers.Authorization = `Token ${Cookies.get('token')}`;
	}

	try {
		const response = await fetch(`/api/${url}/`, {
			method: 'POST',
			headers,
			body: JSON.stringify(params.body), // Convert the object to JSON
		});
		const data = await response.json();
		if (data.error) {
			return {
				error: data.error,
				success: false,
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
export const GET = async (url: string, params?: IFetchParams): Promise<any> => {
	const headers: Headers = {};

	if (params?.auth && Cookies.get('token')) {
		headers.Authorization = `Token ${Cookies.get('token')}`;
	}

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

		if (queryString) {
			url += `/?${queryString}`;
		}
	} else {
		url += '/';
	}

	try {
		const response = await fetch(`/api/${url}`, {
			headers,
		});

		const data = await response.json();

		if (data.error) {
			return {
				error: data.error,
				success: false,
			};
		}

		// Используйте новую переменную вместо изменения параметра напрямую
		const responseData = {
			success: true,
			data,
		};

		return responseData;
	} catch (error) {
		return Promise.reject(error);
	}
};
