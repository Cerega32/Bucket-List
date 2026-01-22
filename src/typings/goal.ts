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

export interface ICategoryTree extends ICategoryDetailed {
	children: ICategoryTree[];
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
	estimatedTime?: never;
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
	userFolders?: IGoalFolderTag[];
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

	// Поля для регулярных целей
	regularConfig?: IRegularGoalConfig;
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
	estimatedTime?: string;
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

export interface IGoalFolder {
	id: number;
	name: string;
	description?: string;
	user?: number;
	userUsername?: string;
	color?: string;
	icon?: string;
	isPrivate: boolean;
	createdAt: string;
	updatedAt: string;
	goalsCount: number;
	items?: IGoalFolderItem[];
}

export interface IGoalFolderItem {
	id: number;
	image?: string;
	code: string;
	goal: number;
	title: string;
	category: string;
	complexity: string;
	order: number;
	addedAt: string;
}

export interface ICreateFolderData {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	is_private?: boolean;
}

export type IUpdateFolderData = ICreateFolderData;

export interface IFolderGoal {
	id: number;
	goal: IGoal;
	order: number;
	added_at: string;
}

export interface IGoalFolderTag {
	id: number;
	name: string;
	color: string;
	icon: string;
}

// Типы для регулярных целей
export interface IRegularGoalConfig {
	id: number;
	frequency: 'daily' | 'weekly' | 'custom';
	weeklyFrequency?: number;
	customSchedule?: any;
	durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
	durationValue?: number;
	endDate?: string;
	allowSkipDays: number;
	resetOnSkip: boolean;
	isActive: boolean;
	allowCustomSettings: boolean;
	createdAt: string;
	statistics?: IRegularGoalStatistics;
	completedSeriesCount?: number; // Количество завершенных серий из истории (показывается даже если цель удалена)
}

export interface IRegularGoalStatistics {
	id: number;
	user: number;
	userUsername: string;
	regularGoal: number;
	regularGoalData: {
		id: number;
		goal: number;
		goalTitle: string;
		goalCode: string;
		goalImage: string;
		goalCategory: string;
		frequency: 'daily' | 'weekly' | 'custom';
		weeklyFrequency?: number;
		customSchedule?: any;
		durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
		durationValue?: number;
		endDate?: string;
		allowSkipDays: number;
		resetOnSkip: boolean;
		isActive: boolean;
		createdAt: string;
		updatedAt: string;
	};
	totalCompletions: number;
	totalDays: number;
	completionPercentage: number;
	currentStreak: number;
	maxStreak: number;
	startDate?: string;
	lastCompletionDate?: string;
	totalWeeks: number;
	completedWeeks: number;
	currentWeekCompletions: number;
	earnedSkipDays?: number;
	consecutiveCompletionsForSkip?: number;
	usedSkipDays?: number;
	remainingSkipDays?: number; // Количество использованных разрешенных пропусков
	isActive: boolean;
	isPaused: boolean;
	resetCount: number;
	isInterrupted?: boolean;
	interruptedStreak?: number | null;
	interruptedCompletionPercentage?: number | null;
	isSeriesCompleted?: boolean;
	completedSeriesCount?: number;
	seriesCompletionDate?: string;
	currentPeriodProgress?: {
		type: 'daily' | 'weekly' | 'custom';
		completedToday?: boolean;
		streak?: number;
		currentWeekCompletions?: number;
		requiredPerWeek?: number;
		weekProgress?: number;
		weekStart?: string;
		weekEnd?: string;
		customSchedule?: any;
		weekDays?: Array<{
			dayIndex: number;
			dayName: string;
			isAllowed: boolean;
			isBlocked: boolean; // Блокировка по расписанию (для weekly/custom - показываем крестик)
			isBlockedByStartDate?: boolean; // Блокировка из-за даты начала (показываем пустым, серый фон)
			isCompleted: boolean; // Зеленый фон (для всех дней, если неделя выполнена для weekly)
			isCompletedDay?: boolean; // Реально выполненный день (с галочкой для weekly)
			isSkipped?: boolean; // Использован разрешенный пропуск
			date: string;
		}>;
	};
	nextTargetDate?: string;
	canCompleteToday: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface IRegularGoalHistory {
	id: number;
	user: number;
	userUsername: string;
	regularGoal: number;
	regularGoalData: {
		id: number;
		goal: number;
		goalTitle: string;
		goalCode: string;
		goalImage: string;
		goalCategory: string;
		frequency: 'daily' | 'weekly' | 'custom';
		weeklyFrequency?: number;
		customSchedule?: any;
		durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
		durationValue?: number;
		endDate?: string;
		allowSkipDays: number;
		daysForEarnedSkip?: number;
		resetOnSkip: boolean;
		isActive: boolean;
		createdAt: string;
		updatedAt: string;
	};
	status: 'completed' | 'interrupted';
	statusDisplay: string;
	streak: number;
	completionPercentage?: number | null;
	startDate?: string;
	endDate: string;
	totalCompletions: number;
	totalDays: number;
	createdAt: string;
}
