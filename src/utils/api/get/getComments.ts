import {IComment} from '@/typings/comments';
import {AnyResponsePagination, ISuccessResponseWithPagination} from '@/typings/request';
import {GET} from '@/utils/fetch/requests';

export interface ICommentsWithImagesData {
	data: Array<IComment>;
	pagination: ISuccessResponseWithPagination<Array<IComment>>['data']['pagination'];
	popular_images?: string[];
}

export type ICommentsWithImagesResponse = {
	success: boolean;
	data: ICommentsWithImagesData;
	error?: string;
};

export const getComments = async (codeGoal: string): Promise<AnyResponsePagination<Array<IComment>>> => {
	const response = await GET(`goals/${codeGoal}/comments`, {
		auth: true,
	});
	return response as AnyResponsePagination<Array<IComment>>;
};

export const getCommentsWithImages = async (codeGoal: string): Promise<ICommentsWithImagesResponse> => {
	const response = await GET(`goals/${codeGoal}/comments`, {
		auth: true,
		get: {
			include_images: '1',
		},
	});

	return response as ICommentsWithImagesResponse;
};
