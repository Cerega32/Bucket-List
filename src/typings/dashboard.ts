import {IShortGoal} from './goal';

export interface IUserStats {
	completedGoals: number;
	currentStreak: number;
	maxStreak: number;
}

export interface ITimer {
	id: number;
	goal: {
		code: string;
		title: string;
		complexity: 'easy' | 'medium' | 'hard';
		completedByUser: boolean;
	};
	deadline: string;
	daysLeft: number;
}

export interface ICategoryProgress {
	name: string;
	total: number;
	completed: number;
	percentage: number;
	color?: string;
}

export interface IGoalHealth {
	total: number;
	completed: number;
	expired: number;
	active: number;
}

export interface IHundredGoalsList {
	progress: number;
	percentage: number;
	completed: number;
	categories: Record<string, number>;
}

export interface IDashboardData {
	userStats: IUserStats;
	dailyQuote: string;
	upcomingTimers: ITimer[];
	categoriesProgress: ICategoryProgress[];
	goalHealth: IGoalHealth;
	goalsCount: number;
	listsCount: number;
	categoriesCount: number;
	popularGoals: IShortGoal[];
	hundredGoalsList: IHundredGoalsList;
}
