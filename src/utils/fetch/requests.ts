// export const GET = async (url): Promise<> => {
// 	return fetch(url);
// };

import Cookies from 'js-cookie';

interface IPostBody {
	[key: string]: any;
}

interface IFetchParams {
	auth?: boolean;
	get?: {[key: string]: string};
}

type IFetchPostParams = IFetchParams & {
	body?: IPostBody;
};

type Headers = HeadersInit & {
	Authorization?: string;
};

export const POST = async (
	url: string,
	params: IFetchPostParams
): Promise<any> => {
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
	let get = '';
	if (params?.get) {
	}

	try {
		const response = await fetch(`/api/${url}/`, {
			headers,
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
