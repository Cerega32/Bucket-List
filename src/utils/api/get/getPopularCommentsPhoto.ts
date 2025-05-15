import {GET} from '@/utils/fetch/requests';

export const getPopularCommentsPhoto = async () => {
	const response = await GET('comments/popular-photos');

	return response;
};
