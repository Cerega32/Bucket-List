export type IComplexity = 'hard' | 'medium' | 'easy';

export interface ICategory {
	id: number;
	name: string;
	nameEn: string;
	parentCategory: number | null;
}

export interface ICategoryDetailed {
	id: number;
	name: string;
	nameEn: string;
	parentCategory: ICategory | null;
	image: string;
	goalCount: number;
	icon: string | null;
}

export interface ICategoryWithSubcategories {
	category: ICategoryDetailed;
	subcategories: Array<ICategoryDetailed>;
}

export interface IShortList {
	code: string;
	image: string;
	shortDescription: string;
	category: ICategory;
	complexity: IComplexity;
	totalCompleted: number;
	title: string;
	addedByUser: boolean;
	completedByUser: boolean;
	totalAdded: number;
	userCompletedGoals: number;
	goalsCount: number;
}

export interface IGoal {
	category: ICategory;
	code: string;
	complexity: IComplexity;
	description: string;
	id: number;
	image: string;
	shortDescription: string;
	subcategory: ICategory;
	title: string;
	totalAdded: number;
	totalCompleted: number;
	lists: Array<IShortList>;
	listsCount: number;
	completedByUser: boolean;
	addedByUser: boolean;
	totalLists: number;
	totalComments: number;
}

export interface IShortGoal {
	category: ICategory;
	code: string;
	complexity: IComplexity;
	description: string;
	image: string;
	shortDescription: string;
	subcategory: ICategory;
	title: string;
	completedByUser: boolean;
	totalCompleted: number;
	totalAdded: number;
	addedByUser: boolean;
}
