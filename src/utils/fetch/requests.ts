// // export const GET = async (url): Promise<> => {
// // 	return fetch(url);
// // };

// import Cookies from 'js-cookie';

// interface IPostBody {
// 	[key: string]: any;
// }

// export interface IRequestGet {
// 	[key: string]: string | number | boolean | undefined | null;
// }

// interface IFetchParams {
// 	auth?: boolean;
// 	get?: IRequestGet;
// }

// type IFetchPostParams = IFetchParams & {
// 	body?: IPostBody;
// 	file?: boolean;
// };

// type Headers = HeadersInit & {
// 	Authorization?: string;
// };

// export const POST = async (url: string, params: IFetchPostParams): Promise<any> => {
// 	const headers: Headers = {};
// 	if (params.auth && Cookies.get('token')) {
// 		headers.Authorization = `Token ${Cookies.get('token')}`;
// 	}

// 	if (!params?.file) {
// 		headers['Content-Type'] = 'application/json';
// 	}

// 	try {
// 		const response = await fetch(`/api/${url}/`, {
// 			method: 'POST',
// 			headers,
// 			body: params.file ? params.body : JSON.stringify(params.body), // Convert the object to JSON
// 		});
// 		const data = await response.json();
// 		if (data.error) {
// 			return {
// 				error: data.error,
// 				success: false,
// 			};
// 		}
// 		return {
// 			success: true,
// 			data,
// 		};
// 	} catch (error) {
// 		return Promise.reject(error);
// 	}
// };

// export const DELETE = async (url: string, params: IFetchPostParams): Promise<any> => {
// 	const headers: Headers = {};
// 	if (params.auth && Cookies.get('token')) {
// 		headers.Authorization = `Token ${Cookies.get('token')}`;
// 	}

// 	if (!params?.file) {
// 		headers['Content-Type'] = 'application/json';
// 	}

// 	try {
// 		const response = await fetch(`/api/${url}/`, {
// 			method: 'DELETE',
// 			headers,
// 			body: JSON.stringify(params.body),
// 		});
// 		const data = await response.json();
// 		if (data.error) {
// 			return {
// 				error: data.error,
// 				success: false,
// 			};
// 		}
// 		return {
// 			success: true,
// 			data,
// 		};
// 	} catch (error) {
// 		return Promise.reject(error);
// 	}
// };

// export const GET = async (url: string, params?: IFetchParams): Promise<any> => {
// 	const headers: Headers = {};

// 	if (params?.auth && Cookies.get('token')) {
// 		headers.Authorization = `Token ${Cookies.get('token')}`;
// 	}

// 	let queryString = '';

// 	if (params?.get) {
// 		const filteredParams = Object.entries(params.get)
// 			.filter(([_, value]) => value !== undefined && value !== null)
// 			.reduce((result, [key, value]) => {
// 				result[key] = value;
// 				return result;
// 			}, {} as Record<string, string | number | boolean>);

// 		const urlSearchParams = new URLSearchParams(filteredParams);
// 		queryString = urlSearchParams.toString();

// 		if (queryString) {
// 			url += `/?${queryString}`;
// 		}
// 	} else {
// 		url += '/';
// 	}

// 	try {
// 		const response = await fetch(`/api/${url}`, {
// 			headers,
// 		});

// 		const data = await response.json();

// 		if (data.error) {
// 			return {
// 				error: data.error,
// 				success: false,
// 			};
// 		}

// 		// Используйте новую переменную вместо изменения параметра напрямую
// 		const responseData = {
// 			success: true,
// 			data,
// 		};

// 		return responseData;
// 	} catch (error) {
// 		return Promise.reject(error);
// 	}
// };

import Cookies from 'js-cookie';

interface IRequestGet {
	[key: string]: string | number | boolean;
}

interface IFetchParams {
	auth?: boolean;
	get?: IRequestGet;
	file?: boolean;
	body?: Record<string, any>; // Updated to accept any type of body
}

type Headers = HeadersInit & {
	Authorization?: string;
};

const setHeaders = (params: IFetchParams): Headers => {
	const headers: Headers = {};
	if (params.auth && Cookies.get('token')) {
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
