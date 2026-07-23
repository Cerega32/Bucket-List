import {GET} from '@/shared/api/http/requests';

export const getPopularCommentsPhoto = async (limit = 40) => {
	const response = await GET('comments/popular-photos', {get: {limit}});

	return response;
};
