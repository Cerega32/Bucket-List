import {ICategory, IComplexity, IShortGoal} from '@/typings/goal';

export interface IList {
	code: string;
	title: string;
	category: ICategory;
	subcategory: ICategory;
	complexity: IComplexity;
	image: string;
	description: string;
	shortDescription: string;
	totalCompleted: number;
	totalAdded: number;
	addedByUser: boolean;
	completedByUser: boolean;
	goals: Array<IShortGoal>;
	goalsCount: number;
	userCompletedGoals: number;
}
