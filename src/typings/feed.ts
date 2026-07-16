export type FriendsNewsEventType =
	| 'achievement'
	| 'level_up'
	| 'streak'
	| 'return_after_pause'
	| 'list_completed'
	| 'goal_taken_from_your_list'
	| 'popular_goal_completed'
	| 'daily_stats'
	| 'weekly_leader'
	| 'goal_review'
	| 'list_review'
	| 'friend_added';

export interface IFeedCompletedItem {
	id: number;
	code: string;
	title: string;
}

export interface FriendsNewsEvent {
	id: string;
	type: FriendsNewsEventType;
	userId: number;
	userName: string;
	userAvatar?: string | null;
	createdAt: string;
	likesCount: number;
	likedByMe: boolean;
	// Событие текущего пользователя: влияет на отображение карточки и подпись «Вы»
	isOwn?: boolean;
	// Дополнительные данные, приходящие с бэкенда — зависят от типа события
	achievementId?: number;
	achievementTitle?: string;
	achievementDescription?: string;
	achievementIsSecret?: boolean;
	achievementImage?: string | null;
	level?: number;
	streakDays?: number;
	listId?: number;
	listCode?: string;
	listName?: string;
	sourceGoalId?: number;
	sourceGoalCode?: string;
	sourceGoalTitle?: string;
	sourceUserId?: number;
	sourceUserName?: string;
	sourceUserAvatar?: string | null;
	goalId?: number;
	goalCode?: string;
	goalTitle?: string;
	friendsWithSameGoalCount?: number;
	goalsCount?: number;
	listsCount?: number;
	pauseDays?: number;
	placeInLeaders?: number;
	completedGoals?: IFeedCompletedItem[];
	completedLists?: IFeedCompletedItem[];
	reviewId?: number;
	reviewText?: string;
}

export interface IFriendsFeedResponse {
	results: FriendsNewsEvent[];
	hasMore: boolean;
	nextPage: number | null;
}
