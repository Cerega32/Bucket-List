import {makeAutoObservable} from 'mobx';

import {IHeaderNotification} from '@/typings/notification';
import {markAllNotificationsAsRead, markNotificationAsRead} from '@/utils/api/notifications';

class Store {
	notifications: IHeaderNotification[] = [];

	unreadCount = 0;

	isLoading = false;

	constructor() {
		makeAutoObservable(this);
	}

	setNotifications(notifications: IHeaderNotification[]) {
		this.notifications = notifications;
	}

	setUnreadCount(count: number) {
		this.unreadCount = count;
	}

	setLoading(loading: boolean) {
		this.isLoading = loading;
	}

	get hasUnreadNotifications() {
		return this.unreadCount > 0;
	}

	async markAsRead(notificationId: number) {
		try {
			await markNotificationAsRead(notificationId);

			// Обновляем локальное состояние
			this.notifications = this.notifications.map((n) => (n.id === notificationId ? {...n, isRead: true} : n));
			const wasUpdated = this.notifications.some((n) => n.id === notificationId && n.isRead);
			if (wasUpdated) {
				this.unreadCount = Math.max(0, this.unreadCount - 1);
			}
		} catch (error) {
			console.error('Ошибка отметки уведомления как прочитанного:', error);
			throw error;
		}
	}

	async markAllAsRead() {
		try {
			await markAllNotificationsAsRead();

			// Обновляем локальное состояние
			this.notifications = this.notifications.map((notification) => ({
				...notification,
				isRead: true,
			}));
			this.unreadCount = 0;
		} catch (error) {
			console.error('Ошибка отметки всех уведомлений как прочитанных:', error);
			throw error;
		}
	}

	clearNotifications() {
		this.notifications = [];
		this.unreadCount = 0;
	}
}

export const HeaderNotificationsStore = new Store();
