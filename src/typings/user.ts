export interface IUserInfo {
	aboutMe: string;
	avatar: string | null | undefined;
	country: string;
	coverImage: string | null | undefined;
	email: string;
	isEmailConfirmed?: boolean;
	firstName: string;
	id: number;
	name: string;
	lastName: string;
	username: string;
	totalAddedGoals: number;
	totalCompletedGoals: number;
	totalAddedLists: number;
	totalCompletedLists: number;
	totalAchievements: number;
	subscriptionType?: 'free' | 'premium';
	subscriptionExpiresAt?: string | null;
	subscriptionAutoRenew?: boolean;
	level?: number;
	counts?: {
		regularGoals: number;
		progressGoals: number;
		folders: number;
		friends: number;
		goalsWithMap: number;
	};
}

export interface IWeeklyLeader {
	avatar: string;
	experienceEarnedWeek: number;
	totalCompletedGoals: number;
	weekCompletedGoals: number;
	id: number;
	level: number;
	name: string;
	place: number;
	reviewsAddedWeek: number;
}

export interface IInfoStats {
	experienceEarned: number;
	goalsCompleted: number;
	reviewsAdded: number;
}

export interface ICurrentStats {
	weeklyRank: number;
	activeGoals: number;
	activeLists: number;
	level: number;
	currentExperience: number;
	nextLevelExperience: number;
}

export interface ITotalStats {
	reviewsCount: number;
	completedGoals: number;
	completedLists: number;
	achievementsCount: number;
	weeklyCompletedChallenges: number;
	totalWeeklyChallenges: number;
}

export interface IWeeklyProgressItem {
	weekNumber: number;
	month: number;
	completedGoals: number;
	startDate: string;
	endDate: string;
}

export interface IStatGoal {
	completed: number;
	total: number;
}

export interface IHundredGoals {
	easy: IStatGoal;
	medium: IStatGoal;
	hard: IStatGoal;
}

export interface IUserStatistics {
	currentStats: ICurrentStats;
	totalStats: ITotalStats;
	weeklyProgress: Array<IWeeklyProgressItem>;
	hundredGoals: IHundredGoals;
}

// Типы для системы друзей
export interface IFriend {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	avatar?: string;
	status: 'accepted' | 'pending' | 'rejected';
	createdAt: string;
}

export interface IFriendRequest {
	requestId: number; // ID запроса на дружбу
	id: number; // ID пользователя
	username: string;
	firstName: string;
	lastName: string;
	avatar?: string;
	status?: 'pending' | 'accepted' | 'rejected';
	createdAt: string;
	type: 'incoming' | 'outgoing'; // Тип запроса: входящий или исходящий
}

export interface IFriendSearchResult {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	avatar?: string;
	email: string;
	isFriend: boolean;
	hasPendingRequest: boolean;
	isRequestFromMe: boolean;
}

export interface IFriendsResponse {
	count: number;
	results: IFriend[];
}

export interface IFriendRequestsResponse {
	count: number;
	results: IFriendRequest[];
}

export interface IFriendSearchResponse {
	count: number;
	results: IFriendSearchResult[];
}

export interface IFriendComparison {
	friend: IUserInfo;
	comparison: {
		myStats: {
			completedGoals: number;
			totalGoals: number;
			level: number;
			experience: number;
		};
		friendStats: {
			completedGoals: number;
			totalGoals: number;
			level: number;
			experience: number;
		};
	};
}
