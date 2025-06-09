import {GET} from '@/utils/fetch/requests';

export const getCategories = async () => {
	const response = await GET('categories');
	return response;
};

export const getAllCategories = async () => {
	const response = await GET('categories/all');
	return response;
};
