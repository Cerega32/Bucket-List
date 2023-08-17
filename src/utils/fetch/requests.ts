// export const GET = async (url): Promise<> => {
// 	return fetch(url);
// };

import Cookies from 'js-cookie';

interface IPostBody {
	[key: string]: any;
}

export const POST = async (url: string, body: IPostBody): Promise<any> => {
	try {
		const response = await fetch(`api/${url}/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json', // Set the Content-Type header to JSON
			},
			body: JSON.stringify(body), // Convert the object to JSON
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

export const GET = async (url: string, auth?: boolean): Promise<any> => {
	const headers: Headers = {};
	if (auth) {
		headers.Authorization = `Token ${Cookies.get('token')}`;
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
