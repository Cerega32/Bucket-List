export type IComplexity = 'hard' | 'normal' | 'easy';

export interface ICategory {
	id: number;
	name: string;
	name_en: string;
	parent_category: number | null;
}

export interface IShortList {
	image: string;
	shortDescription: string;
	category: ICategory;
	complexity: IComplexity;
	totalCompleted: number;
	title: string;
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
	added: boolean;
	done: boolean;
	totalAdded: number;
	totalCompleted: number;
	lists: Array<IShortList>;
	listsCount: number;
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
}
