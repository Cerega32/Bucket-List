import {ICatalogRejectionInfo, ICategory, IComplexity, IShortGoal} from '@/entities/goal/model/types';

export interface IGoalsPagination {
	page: number;
	pageSize: number;
	totalGoals: number;
	hasMore: boolean;
}

export interface IList extends ICatalogRejectionInfo {
	id: number;
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
	createdByUser: boolean;
	isCanEdit: boolean;
	isCanAddGoals: boolean;
	goalsPagination?: IGoalsPagination;
	hasScratchMap?: boolean;
	hasMyComment?: boolean;
	totalComments?: number;
}
