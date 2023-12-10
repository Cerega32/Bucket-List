import {IComment, IComments} from '@/typings/comments';
import {AnyResponsePagination} from '@/typings/request';
import {GET} from '@/utils/fetch/requests';

export const getComments = async (
	codeGoal: string
): Promise<AnyResponsePagination<Array<IComment>>> => {
	const response = await GET(`goals/${codeGoal}/comments`, {
		auth: true,
	});
	return response;
};
