export type IComplexity = 'hard' | 'medium' | 'easy';

export interface ICategory {
	id: number;
	name: string;
	nameEn: string;
	parentCategory: ICategory | null;
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
	addedFromList: Array<string>;
	categoryRank?: number;
	createdAt: string;
	createdBy?: {
		id: number;
		username: string;
		avatar?: string;
	};
	createdByUser: boolean;
	isCanEdit: boolean;
	totalAdditions?: number;
	estimatedTime?: string;
	location?: ILocation;
	userVisitedLocation: boolean;
	timer?: {
		deadline: string;
		days_left: number;
		is_expired: boolean;
	} | null;

	// Поля для игр
	gamePlatforms?: string[];
	gameRating?: number;
	gameMetacritic?: number;
	gameIdRawg?: string;
	gameReleased?: string;
	gameGenres?: string[];
	gameDevelopers?: string[];

	// Поля для книг
	bookAuthors?: string[];
	bookPublishedDate?: string;

	// Поля для фильмов
	movieContentType?: string;
	movieIdKinopoisk?: string;
	movieRatingKp?: number;
	movieRatingImdb?: number;
	movieYear?: number;
	movieGenres?: string[];
	movieCountries?: string[];
}

export interface IShortGoal {
	id: number;
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
	location?: ILocation;
}

// Типы для работы с картами
export interface ILocation {
	id: number;
	name: string;
	country: string;
	city?: string;
	latitude: number;
	longitude: number;
	place_type: string;
	description?: string;
	address?: string;
	created_at: string;
}
