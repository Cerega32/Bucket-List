import {IComment} from '@/typings/comments';
import {GET} from '@/utils/fetch/requests';

export interface ICommentsInitialData {
	myComment: IComment | null;
	comments: Array<IComment>;
	hasMore: boolean;
	nextPage: number | null;
}

export interface ICommentsPageData {
	comments: Array<IComment>;
	hasMore: boolean;
	nextPage: number | null;
}

export type ICommentsInitialResponse = {
	success: boolean;
	data: ICommentsInitialData;
	error?: string;
};

export type ICommentsPageResponse = {
	success: boolean;
	data: ICommentsPageData;
	error?: string;
};

export type IImpressionImagesResponse = {
	success: boolean;
	data: {images: string[]};
	error?: string;
};

/** Первая загрузка: my_comment + 2/3 чужих */
export const getInitialComments = async (codeGoal: string): Promise<ICommentsInitialResponse> => {
	const response = await GET(`goals/${codeGoal}/comments`, {auth: true});
	return response as ICommentsInitialResponse;
};

/** Дозагрузка: 10 чужих комментариев, page >= 2 */
export const getMoreComments = async (codeGoal: string, page: number): Promise<ICommentsPageResponse> => {
	const response = await GET(`goals/${codeGoal}/comments`, {
		auth: true,
		get: {page: String(page)},
	});
	return response as ICommentsPageResponse;
};

/** Случайные изображения из отзывов для секции впечатлений */
export const getGoalImpressionImages = async (codeGoal: string): Promise<IImpressionImagesResponse> => {
	const response = await GET(`goals/${codeGoal}/impression-images`, {auth: false});
	return response as IImpressionImagesResponse;
};

/** Изображения из отзывов пользователя (витрина) */
export const getUserImpressionImages = async (userId: string): Promise<IImpressionImagesResponse> => {
	const response = await GET(`comments/${userId}/impression-images`, {auth: false});
	return response as IImpressionImagesResponse;
};

/** Первая загрузка комментариев пользователя (витрина): 3 шт. */
export const getUserInitialComments = async (userId: string): Promise<ICommentsInitialResponse> => {
	const response = await GET(`comments/${userId}`, {auth: true});
	return response as ICommentsInitialResponse;
};

/** Дозагрузка комментариев пользователя: 10 шт., page >= 2 */
export const getUserMoreComments = async (userId: string, page: number): Promise<ICommentsPageResponse> => {
	const response = await GET(`comments/${userId}`, {
		auth: true,
		get: {page: String(page)},
	});
	return response as ICommentsPageResponse;
};
