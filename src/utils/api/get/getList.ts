import {GET} from '@/utils/fetch/requests';

export const getList = async (url: string) => {
	const response = await GET(url, {auth: true});
	return response;
};
