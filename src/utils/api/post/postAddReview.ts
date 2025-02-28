import {POST} from '@/utils/fetch/requests';

export const postAddReview = async (comment: FormData) => {
	// TODO исправить тип
	const response = await POST('comments/add', {body: comment, auth: true, file: true});
	return response;
};
