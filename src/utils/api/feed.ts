import {IFriendsFeedResponse} from '@/typings/feed';
import {GET, POST} from '@/utils/fetch/requests';

// Получение ленты друзей (свои события + события принятых друзей)
export const getFriendsFeed = async (page = 1): Promise<IFriendsFeedResponse> => {
	const response = await GET('feed', {
		get: {page},
		showSuccessNotification: false,
		auth: true,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось загрузить ленту друзей');
	}

	return response.data;
};

// Лайк / снятие лайка события ленты (в том числе своего собственного)
export const toggleFeedEventLike = async (eventId: string): Promise<{likedByMe: boolean; likesCount: number}> => {
	const response = await POST(`feed/${eventId}/like`, {
		auth: true,
		showSuccessNotification: false,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось поставить лайк');
	}

	return response.data;
};
