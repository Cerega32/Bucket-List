import {News, NewsComment, NewsCommentCreate, NewsCommentsResponse, NewsListResponse} from '@/typings/news';
import {DELETE, GET, POST, PUT} from '@/utils/fetch/requests';

/**
 * Получение списка новостей с пагинацией
 */
export const fetchNews = async (page = 1, pageSize = 10): Promise<NewsListResponse> => {
	const response = await GET('news', {
		get: {page, page_size: pageSize},
		showSuccessNotification: false,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Ошибка загрузки новостей');
	}

	return response.data;
};

/**
 * Получение детальной информации о новости
 */
export const fetchNewsDetail = async (id: number): Promise<News> => {
	const response = await GET(`news/${id}`, {
		showSuccessNotification: false,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Ошибка загрузки новости');
	}

	return response.data;
};

/**
 * Поиск новостей
 */
export const searchNews = async (query: string, page = 1, pageSize = 10): Promise<NewsListResponse> => {
	const response = await GET('news', {
		get: {search: query, page, page_size: pageSize},
		showSuccessNotification: false,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Ошибка поиска новостей');
	}

	return response.data;
};

/**
 * Получение комментариев к новости
 */
export const fetchNewsComments = async (newsId: number, page = 1, pageSize = 50): Promise<NewsCommentsResponse> => {
	const response = await GET(`news/${newsId}/comments/`, {
		get: {page, page_size: pageSize},
		showSuccessNotification: false,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Ошибка загрузки комментариев');
	}

	return response.data;
};

/**
 * Добавление комментария к новости
 */
export const addNewsComment = async (newsId: number, commentData: NewsCommentCreate): Promise<NewsComment> => {
	const response = await POST(`news/${newsId}/comments/create/`, {
		body: commentData,
		auth: true,
		success: {
			type: 'success',
			title: 'Комментарий добавлен',
			message: 'Ваш комментарий успешно опубликован',
		},
	});

	if (!response.success) {
		throw new Error(response.errors || 'Ошибка добавления комментария');
	}

	return response.data;
};

/**
 * Обновление комментария
 */
export const updateNewsComment = async (newsId: number, commentId: number, content: string): Promise<NewsComment> => {
	const response = await PUT(`news/${newsId}/comments/${commentId}/`, {
		body: {content},
		auth: true,
		success: {
			type: 'success',
			title: 'Комментарий обновлен',
			message: 'Изменения сохранены',
		},
	});

	if (!response.success) {
		throw new Error(response.errors || 'Ошибка обновления комментария');
	}

	return response.data;
};

/**
 * Удаление комментария
 */
export const deleteNewsComment = async (newsId: number, commentId: number): Promise<void> => {
	const response = await DELETE(`news/${newsId}/comments/${commentId}/delete/`, {
		auth: true,
		success: {
			type: 'success',
			title: 'Комментарий удален',
			message: 'Комментарий успешно удален',
		},
	});

	if (!response.success) {
		throw new Error(response.errors || 'Ошибка удаления комментария');
	}
};

/**
 * Получение ответов на комментарий (теперь не нужно, так как загружаются рекурсивно)
 */
export const fetchCommentReplies = async (newsId: number, commentId: number, page = 1, pageSize = 20): Promise<NewsCommentsResponse> => {
	const response = await GET(`news/${newsId}/comments/${commentId}/replies/`, {
		get: {page, page_size: pageSize},
		showSuccessNotification: false,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Ошибка загрузки ответов');
	}

	return response.data;
};
