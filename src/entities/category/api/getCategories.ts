import {GET} from '@/shared/api/http/requests';

export const getCategories = async () => {
	const response = await GET('categories');
	return response;
};

export const getAllCategories = async () => {
	const response = await GET('categories/all');
	return response;
};
