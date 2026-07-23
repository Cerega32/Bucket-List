import {GET, IRequestGet} from '@/shared/api/http/requests';

export const getList = async (url: string, queryParams?: IRequestGet) => {
	const response = await GET(url, {auth: true, get: queryParams});
	return response;
};
