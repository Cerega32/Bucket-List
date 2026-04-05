export type NotificationType =
	| 'friend_request'
	| 'friend_accepted'
	| 'friend_rejected'
	| 'achievement'
	| 'goal_completed'
	| 'goal_approved'
	| 'goal_rejected'
	| 'list_completed'
	| 'level_up'
	| 'daily_goal_reminder'
	| 'daily_goal_streak_broken'
	| 'goal_merged'
	| 'merge_request'
	| 'daily_challenge'
	| 'weekly_challenge';

export interface IHeaderNotification {
	id: number;
	type: NotificationType;
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
	relatedObjectId?: number;
	relatedObjectType?: 'goal' | 'achievement' | 'user' | 'list' | 'friendship';
	relatedObjectImage?: string;
	relatedObjectCode?: string;
}

export interface IHeaderNotificationsResponse {
	count: number;
	unreadCount: number;
	results: IHeaderNotification[];
}
