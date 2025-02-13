import {makeAutoObservable} from 'mobx';

type NotificationType = 'success' | 'error' | 'warning';

export interface INotification {
	id: string;
	type: NotificationType;
	title: string;
	message?: string | {[key: string]: Array<string>};
	actionText?: string;
	action?: () => void;
}

class Store {
	private queue: INotification[] = []; // Очередь всех уведомлений
	visibleNotifications: INotification[] = []; // Отображаемые уведомления (макс. 3)

	constructor() {
		makeAutoObservable(this);
	}

	addNotification(notification: Omit<INotification, 'id'>) {
		const id = Math.random().toString(36).substr(2, 9);
		this.queue.push({id, ...notification});

		this.showNextNotification();
	}

	private showNextNotification() {
		while (this.visibleNotifications.length < 3 && this.queue.length > 0) {
			const nextNotification = this.queue.shift();
			if (nextNotification) {
				this.visibleNotifications.push(nextNotification);

				setTimeout(() => this.removeNotification(nextNotification.id), 7000);
			}
		}
	}

	removeNotification(id: string) {
		this.visibleNotifications = this.visibleNotifications.filter((n) => n.id !== id);
		this.showNextNotification(); // Показываем следующее уведомление
	}
}

export const NotificationStore = new Store();
