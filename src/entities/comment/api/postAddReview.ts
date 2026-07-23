import {POST} from '@/shared/api/http/requests';

export const postAddReview = async (comment: FormData) => {
	// TODO исправить тип
	const response = await POST('comments/add', {body: comment, auth: true, file: true});
	return response;
};
