export type AchievementCategory = 'first_steps' | 'progress' | 'activity' | 'achievements' | 'other';

export interface IAchievement {
	id: number;
	title: string;
	description: string;
	image: string;
	isAchieved: boolean;
	category: AchievementCategory;
	conditionType?: string;
	condition?: Record<string, any>;
	isSecret?: boolean;
}
