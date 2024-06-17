import {makeAutoObservable} from 'mobx';

interface Notification {
	text: string;
	isError: boolean;
	isSuccess: boolean;
}

class Store {
	notifications: Array<Notification> = [];

	constructor() {
		makeAutoObservable(this);
	}

	addNotification(notification: Notification) {
		if (this.notifications.length < 10) {
			this.notifications.push(notification);
		}
	}

	removeNotification(index: number) {
		this.notifications.splice(index, 1);
	}
}

export const NotificationStore = new Store();
