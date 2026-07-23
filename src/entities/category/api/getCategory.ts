import {GET} from '@/shared/api/http/requests';

export const getCategory = async (code: string) => {
	const response = await GET(`categories/${code}`);
	return response;
};
