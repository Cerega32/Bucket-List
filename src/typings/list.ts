import {ICategory, IComplexity, IShortGoal} from '@/typings/goal';

export interface IList {
	title: string;
	category: ICategory;
	subcategory: ICategory;
	complexity: IComplexity;
	image: string;
	description: string;
	shortDescription: string;
	completedUsersCount: number;
	addedUsersCount: number;
	addedByUser: boolean;
	goals: Array<IShortGoal>;
}
