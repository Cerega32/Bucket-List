import {POST} from '@/utils/fetch/requests';

export const postAddReview = async (comment) => {
	const response = await POST('comments/add', {body: comment, auth: true, file: true});
	return response;
};
