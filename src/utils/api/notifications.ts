import {IHeaderNotificationsResponse} from '@/typings/notification';
import {GET, PUT} from '@/utils/fetch/requests';

// Получение списка уведомлений
export const getHeaderNotifications = async (): Promise<IHeaderNotificationsResponse> => {
	const response = await GET('notifications', {
		showSuccessNotification: false,
		auth: true,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось получить уведомления');
	}

	return response.data;
};

// Отметить уведомление как прочитанное
export const markNotificationAsRead = async (notificationId: number): Promise<{message: string}> => {
	const response = await PUT(`notifications/${notificationId}/read`, {
		auth: true,
		showSuccessNotification: false,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось отметить уведомление как прочитанное');
	}

	return response.data;
};

// Отметить все уведомления как прочитанные
export const markAllNotificationsAsRead = async (): Promise<{message: string}> => {
	const response = await PUT('notifications/read-all', {
		auth: true,
		showSuccessNotification: false,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось отметить все уведомления как прочитанные');
	}

	return response.data;
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
	const response = await GET('notifications/unread-count', {
		showSuccessNotification: false,
		auth: true,
	});

	if (!response.success) {
		throw new Error(response.errors || 'Не удалось получить количество непрочитанных уведомлений');
	}

	return response.data.unreadCount;
};
