import {IComment} from '@/typings/comments';
import {POST} from '@/utils/fetch/requests';

interface IResError {
	success: false;
	error: string;
}

interface IResSuccess {
	data: IComment;
	success: true;
}

export const postLikeComment = async (id: number, isLike: boolean): Promise<IResError | IResSuccess> => {
	const response = await POST(`comments/${id}/like-or-dislike`, {
		auth: true,
		body: {isLike},
	});
	return response;
};
