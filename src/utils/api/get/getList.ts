import {GET, IRequestGet} from '@/utils/fetch/requests';

export const getList = async (url: string, queryParams?: IRequestGet) => {
	const response = await GET(url, {auth: true, get: queryParams});
	return response;
};
