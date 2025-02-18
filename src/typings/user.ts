export interface IUserInfo {
	aboutMe: string;
	avatar: string | null | undefined;
	country: string;
	coverImage: string | null | undefined;
	email: string;
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
