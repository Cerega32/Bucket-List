export interface IHeaderNotification {
	id: number;
	type: 'friend_request' | 'friend_accepted' | 'friend_rejected' | 'achievement' | 'goal_completed';
	title: string;
	message: string;
	isRead: boolean;
	createdAt: string;
	userId?: number;
	userName?: string;
	userAvatar?: string;
	sender?: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		avatar?: string;
	};
}

export interface IHeaderNotificationsResponse {
	count: number;
	unreadCount: number;
	results: IHeaderNotification[];
}
