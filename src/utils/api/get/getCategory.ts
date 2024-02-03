import {GET} from '@/utils/fetch/requests';

export const getCategory = async (code: string) => {
	const response = await GET(`categories/${code}`);
	return response;
};
