import {GET} from '@/utils/fetch/requests';

export const getTopLikedComments = async () => {
	const response = await GET('comments/top-liked', {auth: true});
	return response;
};
