import {GET} from '@/utils/fetch/requests';

export const getTopLikedComments = async (limit = 20) => {
	const response = await GET('comments/top-liked', {auth: true, get: {limit}});

	return response;
};
