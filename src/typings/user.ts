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
