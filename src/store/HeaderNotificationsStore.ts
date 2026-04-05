import {makeAutoObservable} from 'mobx';

import {IHeaderNotification} from '@/typings/notification';
import {getNotifications, getUnreadCount, markAllNotificationsAsRead, markNotificationRead} from '@/utils/api/notifications';

const POLL_INTERVAL = 60 * 60 * 1000; // 60 минут

class Store {
	notifications: IHeaderNotification[] = [];

	unreadCount = 0;

	isLoading = false;

	private pollTimer: ReturnType<typeof setInterval> | null = null;

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

	/** Загрузить уведомления и unreadCount с сервера */
	async fetchNotifications() {
		const isFirstLoad = this.notifications.length === 0;
		try {
			if (isFirstLoad) this.isLoading = true;
			const res = await getNotifications();
			if (res.success) {
				this.notifications = res.data.results || [];
				this.unreadCount = res.data.unreadCount ?? 0;
			}
		} catch (error) {
			console.error('Ошибка загрузки уведомлений:', error);
		} finally {
			if (isFirstLoad) this.isLoading = false;
		}
	}

	/** Обновить только счётчик непрочитанных (лёгкий запрос) */
	async fetchUnreadCount() {
		try {
			const res = await getUnreadCount();
			if (res.success) {
				this.unreadCount = res.data.unreadCount ?? 0;
			}
		} catch (error) {
			console.error('Ошибка загрузки счётчика уведомлений:', error);
		}
	}

	/** Запустить периодический опрос (при авторизации) */
	startPolling() {
		this.stopPolling();
		this.fetchNotifications();
		this.pollTimer = setInterval(() => {
			this.fetchUnreadCount();
		}, POLL_INTERVAL);
	}

	/** Остановить периодический опрос (при выходе) */
	stopPolling() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer);
			this.pollTimer = null;
		}
	}

	async markAsRead(notificationId: number) {
		try {
			await markNotificationRead(notificationId);

			this.notifications = this.notifications.map((n) => (n.id === notificationId ? {...n, isRead: true} : n));
			this.unreadCount = Math.max(0, this.unreadCount - 1);
		} catch (error) {
			console.error('Ошибка отметки уведомления как прочитанного:', error);
			throw error;
		}
	}

	async markAllAsRead() {
		try {
			await markAllNotificationsAsRead();

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
		this.stopPolling();
		this.notifications = [];
		this.unreadCount = 0;
	}
}

export const HeaderNotificationsStore = new Store();
