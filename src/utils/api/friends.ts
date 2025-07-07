import {HeaderNotificationsStore} from '@/store/HeaderNotificationsStore';
import {IFriendComparison, IFriendRequestsResponse, IFriendSearchResponse, IFriendsResponse} from '@/typings/user';
import {getNotifications} from '@/utils/api/notifications';
import {DELETE, GET, POST} from '@/utils/fetch/requests';

// Функция для обновления уведомлений
const refreshNotifications = async () => {
	try {
		const notificationsData = await getNotifications();
		HeaderNotificationsStore.setNotifications(notificationsData.results);
		HeaderNotificationsStore.setUnreadCount(notificationsData.unreadCount);
	} catch (error) {
		console.error('Ошибка обновления уведомлений:', error);
	}
};

// Получение списка друзей
export const getFriends = async (): Promise<IFriendsResponse> => {
	const response = await GET('friends', {
		showSuccessNotification: false,
		auth: true,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось получить список друзей');
	}

	return response.data;
};

// Получение входящих запросов на дружбу
export const getFriendRequests = async (): Promise<IFriendRequestsResponse> => {
	const response = await GET('friends/requests', {
		showSuccessNotification: false,
		auth: true,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось получить запросы на дружбу');
	}

	return response.data;
};

// Отправка запроса в друзья
export const sendFriendRequest = async (userId: number): Promise<{message: string}> => {
	const response = await POST('friends/send-request', {
		auth: true,
		body: {user_id: userId},
		success: {
			type: 'success',
			title: 'Успешно',
			message: 'Запрос в друзья отправлен',
		},
		error: {
			type: 'error',
			title: 'Ошибка',
			message: '',
		},
		showErrorNotification: false,
	});

	if (!response.success) {
		const errorMessage = response.data?.error || response.errors || 'Не удалось отправить запрос в друзья';
		throw new Error(errorMessage);
	}

	await refreshNotifications();

	return response.data;
};

// Ответ на запрос дружбы (принять/отклонить)
export const respondToFriendRequest = async (requestId: number, action: 'accept' | 'reject'): Promise<{message: string}> => {
	const response = await POST('friends/respond', {
		auth: true,
		body: {
			request_id: requestId,
			action,
		},
		success: {
			type: 'success',
			title: 'Успешно',
			message: action === 'accept' ? 'Запрос в друзья принят' : 'Запрос в друзья отклонен',
		},
		error: {
			type: 'error',
			title: 'Ошибка',
			message: '',
		},
		showErrorNotification: false,
	});

	if (!response.success) {
		const errorMessage = response.data?.error || response.errors || 'Не удалось обработать запрос на дружбу';
		throw new Error(errorMessage);
	}

	await refreshNotifications();

	return response.data;
};

// Удаление из друзей
export const removeFriend = async (friendId: number): Promise<{message: string}> => {
	const response = await DELETE(`friends/remove/${friendId}`, {
		auth: true,
		success: {
			type: 'warning',
			title: 'Выполнено',
			message: 'Пользователь удален из друзей',
		},
		error: {
			type: 'error',
			title: 'Ошибка',
			message: '',
		},
		showErrorNotification: false,
	});

	if (!response.success) {
		const errorMessage = response.data?.error || response.errors || 'Не удалось удалить друга';
		throw new Error(errorMessage);
	}

	return response.data;
};

// Поиск пользователей
export const searchUsers = async (query: string): Promise<IFriendSearchResponse> => {
	const response = await GET(`friends/search?query=${encodeURIComponent(query)}`, {
		showSuccessNotification: false,
		showErrorNotification: false,
		auth: true,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось выполнить поиск пользователей');
	}

	return response.data;
};

// Сравнение с другом
export const compareWithFriend = async (friendId: number): Promise<IFriendComparison> => {
	const response = await GET(`friends/compare/${friendId}`, {
		showSuccessNotification: false,
		auth: true,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось получить сравнение с другом');
	}

	return response.data;
};
