import {IPaginationPage} from '@/typings/request';
import {DELETE, GET, POST, PUT} from '@/utils/fetch/requests';

// ========== PROGRESS API ==========

export interface IGoalProgress {
	id: number;
	goal: number;
	goalTitle: string;
	goalCategory: string;
	goalCategoryNameEn: string;
	goalImage: string;
	goalCode: string;
	progressPercentage: number;
	dailyNotes: string;
	isWorkingToday: boolean;
	lastUpdated: string;
	createdAt: string;
	recentEntries: IGoalProgressEntry[];
	// Для обратной совместимости
	user?: number;
	userUsername?: string;
	entries?: IGoalProgressEntry[];
	notes?: string;
	workedToday?: boolean;
	updatedAt?: string;
}

export interface IGoalProgressEntry {
	id: number;
	goalProgress: number;
	date: string;
	percentageChange: number;
	notes: string;
	workDone: boolean;
	createdAt: string;
	// Для обратной совместимости
	progressChange?: number;
	workedToday?: boolean;
}

export interface IDailyGoal {
	id: number;
	goal: number;
	durationDays: number;
	allowedSkips: number;
	currentStreak: number;
	maxStreak: number;
	totalCompletions: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface IDailyProgress {
	id: number;
	dailyGoal: number;
	date: string;
	completed: boolean;
	notes: string;
	created_at: string;
}

// Получить прогресс цели
export const getGoalProgress = async (
	goalId: number
): Promise<{
	success: boolean;
	data?: IGoalProgress;
	error?: string;
}> => {
	try {
		const response = await GET(`goals/${goalId}/progress`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Создать или обновить прогресс цели (используется один endpoint для создания и обновления)
export const createGoalProgress = async (
	goalId: number,
	data: {
		progress_percentage: number;
		daily_notes: string;
		is_working_today: boolean;
	}
): Promise<{
	success: boolean;
	data?: IGoalProgress;
	error?: string;
}> => {
	try {
		const response = await POST(`goals/${goalId}/progress/update`, {
			body: data,
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Обновить прогресс цели
export const updateGoalProgress = async (
	goalId: number,
	data: {
		progress_percentage: number;
		daily_notes: string;
		is_working_today: boolean;
	}
): Promise<{
	success: boolean;
	data?: IGoalProgress;
	error?: string;
}> => {
	try {
		const response = await POST(`goals/${goalId}/progress/update`, {
			body: data,
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Получить записи прогресса
export const getProgressEntries = async (
	progressId: number
): Promise<{
	success: boolean;
	data?: {results: IGoalProgressEntry[]};
	error?: string;
}> => {
	try {
		const response = await GET(`progress/${progressId}/entries`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Создать запись прогресса
export const createProgressEntry = async (
	goalId: number,
	data: {
		percentage_change: number;
		notes?: string;
		work_done: boolean;
		date?: string;
	}
): Promise<{
	success: boolean;
	data?: IGoalProgressEntry;
	error?: string;
}> => {
	try {
		const response = await POST(`goals/${goalId}/progress/entry`, {
			body: data,
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Daily Goals API
export const getDailyGoals = () => GET('goals/daily-goals', {auth: true});

export const createDailyGoal = (data: Partial<IDailyGoal>) =>
	POST('goals/daily-goals', {
		auth: true,
		body: data,
		success: {
			type: 'success',
			title: 'Ежедневная цель создана',
			message: 'Ежедневная цель успешно настроена',
		},
	});

export const updateDailyGoal = (id: number, data: Partial<IDailyGoal>) =>
	PUT(`goals/daily-goals/${id}`, {
		auth: true,
		body: data,
		success: {
			type: 'success',
			title: 'Ежедневная цель обновлена',
		},
	});

export const getDailyProgress = (dailyGoalId: number) =>
	GET('goals/daily-progress', {
		get: {daily_goal: dailyGoalId},
		auth: true,
	});

export const createDailyProgress = (data: Partial<IDailyProgress>) =>
	POST('goals/daily-progress', {
		body: data,
		auth: true,
		success: {
			type: 'success',
			title: 'Прогресс отмечен',
			message: 'Ежедневный прогресс зафиксирован',
		},
	});

// ========== FOLDERS API ==========

export interface IGoalFolder {
	id: number;
	name: string;
	description: string;
	color: string;
	icon: string;
	isPrivate: boolean;
	goalsCount: number;
	createdAt: string;
	updatedAt: string;
	rules?: IGoalFolderRule[];
}

export interface IGoalFolderItem {
	id: number;
	folder: number;
	goal: number;
	order: number;
	addedAt: string;
	image: string;
	code: string;
	title: string;
	category: string;
	complexity: string;
}

export interface IGoalFolderRule {
	id?: number;
	folder: number;
	ruleType: string;
	ruleTypeDisplay?: string;
	category?: number;
	categoryName?: string;
	complexity?: string;
	keywords?: string;
	removeFromFolder?: number;
	removeFromFolderName?: string;
	daysBeforeDeadline?: number;
	progressThreshold?: number;
	daysWithoutProgress?: number;
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface IRuleOptions {
	ruleTypes: Array<{
		value: string;
		label: string;
		description: string;
	}>;
	categories: Array<{
		id: number;
		name: string;
		nameEn: string;
	}>;
	complexities: Array<{
		value: string;
		label: string;
	}>;
	folders: Array<{
		id: number;
		name: string;
		color: string;
	}>;
}

// Получить папки пользователя (полная информация с целями)
export const getGoalFolders = async (): Promise<{
	success: boolean;
	data?: IGoalFolder[];
	error?: string;
}> => {
	try {
		const response = await GET('goals/folders', {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Получить папки пользователя (легкая версия без целей)
export const getGoalFoldersLight = async (): Promise<{
	success: boolean;
	data?: IGoalFolder[];
	error?: string;
}> => {
	try {
		const response = await GET('goals/folders/light', {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Создать папку
export const createGoalFolder = async (
	data: Partial<IGoalFolder>
): Promise<{
	success: boolean;
	data?: IGoalFolder;
	error?: string;
}> => {
	try {
		const response = await POST('goals/folders', {
			body: data,
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Обновить папку
export const updateGoalFolder = async (
	folderId: number,
	data: Partial<IGoalFolder>
): Promise<{
	success: boolean;
	data?: IGoalFolder;
	error?: string;
}> => {
	try {
		const response = await PUT(`goals/folders/${folderId}`, {
			body: data,
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Удалить папку
export const deleteGoalFolder = async (
	folderId: number
): Promise<{
	success: boolean;
	error?: string;
}> => {
	try {
		const response = await DELETE(`goals/folders/${folderId}`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Папка удалена',
				message: 'Папка целей успешно удалена',
			},
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

export const getFolderGoals = (folderId: number) =>
	GET(`goals/folders/${folderId}/goals`, {
		auth: true,
	});

export const addGoalToFolder = (folderId: number, goalId: number, order?: number) =>
	POST(`goals/folders/${folderId}/add-goal`, {
		body: {goal_id: goalId, order},
		auth: true,
		success: {
			type: 'success',
			title: 'Цель добавлена',
			message: 'Цель добавлена в папку',
		},
	});

export const removeGoalFromFolder = (folderId: number, goalId: number) =>
	DELETE(`goals/folders/${folderId}/remove-goal/${goalId}/`, {
		auth: true,
		success: {
			type: 'success',
			title: 'Цель удалена',
			message: 'Цель удалена из папки',
		},
	});

export const reorderFolderGoals = (folderId: number, goalIds: number[]) =>
	POST(`goals/folders/${folderId}/reorder`, {
		body: {goal_ids: goalIds},
		auth: true,
		success: {
			type: 'success',
			title: 'Порядок изменен',
			message: 'Порядок целей в папке обновлен',
		},
	});

// ========== MERGE REQUESTS API ==========

export interface IGoalMergeRequest {
	id: number;
	requester: number;
	requester_username: string;
	source_goal: number;
	source_goal_title: string;
	target_goal: number;
	target_goal_title: string;
	reason: string;
	status: 'pending' | 'approved' | 'rejected';
	admin_comment: string;
	created_at: string;
	updated_at: string;
}

// Merge Requests API functions
export const getMergeRequests = () => GET('goals/merge-requests', {auth: true});

export const createMergeRequest = (data: {source_goal: number; target_goal: number; reason: string}) =>
	POST('goals/merge-requests', {
		body: data,
		auth: true,
		success: {
			type: 'success',
			title: 'Запрос отправлен',
			message: 'Запрос на объединение целей отправлен на модерацию',
		},
	});

export const getMergeRequestById = (id: number) => GET(`goals/merge-requests/${id}`, {auth: true});

// Получить цели в процессе выполнения
export const getGoalsInProgress = async (): Promise<{
	success: boolean;
	data?: IGoalProgress[];
	error?: string;
}> => {
	try {
		const response = await GET('goals/progress', {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Сбросить прогресс цели
export const resetGoalProgress = async (
	goalId: number
): Promise<{
	success: boolean;
	error?: string;
}> => {
	try {
		const response = await DELETE(`goals/${goalId}/progress`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// ========== REGULAR GOALS API ==========

export interface IRegularGoal {
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
}

export interface IRegularProgress {
	id: number;
	user: number;
	userUsername: string;
	regularGoal: number;
	regularGoalData: IRegularGoal;
	date: string;
	completed: boolean;
	notes: string;
	weekNumber?: number;
	weekCompletionOrder?: number;
	currentStreak: number;
	maxStreak: number;
	createdAt: string;
	updatedAt: string;
}

export interface IRegularGoalStatistics {
	id: number;
	user: number;
	userUsername: string;
	regularGoal: number;
	regularGoalData: IRegularGoal;
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
	isActive: boolean;
	isPaused: boolean;
	resetCount: number;
	currentPeriodProgress?: {
		type: 'daily' | 'weekly';
		completedToday?: boolean;
		streak?: number;
		currentWeekCompletions?: number;
		requiredPerWeek?: number;
		weekProgress?: number;
		weekStart?: string;
	};
	nextTargetDate?: string;
	canCompleteToday: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface IRegularProgressCalendar {
	regularGoal: IRegularGoal;
	calendar: Array<{
		date: string;
		completed: boolean;
		notes: string;
		streak: number;
	}>;
	statistics: IRegularGoalStatistics | null;
}

// Получить список регулярных целей пользователя
export const getRegularGoals = async (): Promise<{
	success: boolean;
	data?: IRegularGoal[];
	error?: string;
}> => {
	try {
		const response = await GET('goals/regular', {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Создать регулярную цель
export const createRegularGoal = async (data: {
	goal_id: number;
	frequency: 'daily' | 'weekly' | 'custom';
	weekly_frequency?: number;
	custom_schedule?: any;
	duration_type: 'days' | 'weeks' | 'until_date' | 'indefinite';
	duration_value?: number;
	end_date?: string;
	allow_skip_days?: number;
	reset_on_skip?: boolean;
}): Promise<{
	success: boolean;
	data?: IRegularGoal;
	error?: string;
}> => {
	try {
		const response = await POST('goals/regular', {
			body: data,
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Отметить выполнение регулярной цели
export const markRegularProgress = async (data: {
	regular_goal_id: number;
	completed?: boolean;
	notes?: string;
	date?: string;
}): Promise<{
	success: boolean;
	data?: {
		progress: IRegularProgress;
		statistics: IRegularGoalStatistics;
	};
	error?: string;
}> => {
	try {
		const response = await POST('goals/regular/mark-progress', {
			body: data,
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Получить статистику регулярных целей
// Поддерживает как обычный ответ (массив),
// так и пагинированный ({ pagination, data }) — на случай,
// если на бэкенде включена пагинация.
export const getRegularGoalStatistics = async (params?: {
	page?: number;
}): Promise<{
	success: boolean;
	data?:
		| IRegularGoalStatistics[]
		| {
				pagination: IPaginationPage;
				data: IRegularGoalStatistics[];
		  };
	error?: string;
}> => {
	try {
		const response = await GET('goals/regular/statistics', {
			auth: true,
			...(params ? {get: params} : {}),
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Получить календарь прогресса регулярной цели
export const getRegularProgressCalendar = async (
	regularGoalId: number
): Promise<{
	success: boolean;
	data?: IRegularProgressCalendar;
	error?: string;
}> => {
	try {
		const response = await GET(`goals/regular/${regularGoalId}/calendar`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Сбросить прогресс регулярной цели (прервать серию)
export const resetRegularGoal = async (
	regularGoalId: number,
	markAsCompleted = false
): Promise<{
	success: boolean;
	data?: IRegularGoalStatistics;
	error?: string;
}> => {
	try {
		const response = await POST(`goals/regular/${regularGoalId}/reset`, {
			auth: true,
			body: {
				mark_as_completed: markAsCompleted,
			},
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Полный сброс прогресса регулярной цели - "Начать заново"
export const restartRegularGoal = async (
	regularGoalId: number
): Promise<{
	success: boolean;
	data?: IRegularGoalStatistics;
	error?: string;
}> => {
	try {
		const response = await POST(`goals/regular/${regularGoalId}/restart`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Получение рейтинга бессрочной регулярной цели
export const getRegularGoalRating = async (
	regularGoalId: number
): Promise<{
	success: boolean;
	data?: {
		users: Array<{
			id: number;
			username: string;
			name: string;
			avatar: string | null;
			level: number;
			maxStreak: number;
			completedSeriesCount: number;
			place: number;
		}>;
	};
	error?: string;
}> => {
	try {
		const response = await GET(`goals/regular/${regularGoalId}/rating`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Получение истории выполнения регулярной цели
export const getRegularGoalHistory = async (
	regularGoalId: number
): Promise<{
	success: boolean;
	data?: {
		history: Array<{
			id: number;
			user: number;
			userUsername: string;
			regularGoal: number;
			regularGoalData: any;
			status: 'completed' | 'interrupted';
			statusDisplay: string;
			streak: number;
			completionPercentage?: number | null;
			startDate?: string;
			endDate: string;
			totalCompletions: number;
			totalDays: number;
			createdAt: string;
		}>;
		count: number;
	};
	error?: string;
}> => {
	try {
		const response = await GET(`goals/regular/${regularGoalId}/history`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Сброс завершенной серии (отмена выполнения)
export const resetCompletedSeries = async (
	regularGoalId: number
): Promise<{
	success: boolean;
	data?: IRegularGoalStatistics;
	error?: string;
}> => {
	try {
		const response = await POST(`goals/regular/${regularGoalId}/reset-completed`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Начало новой серии после завершения предыдущей
export const restartAfterCompletion = async (
	regularGoalId: number
): Promise<{
	success: boolean;
	data?: IRegularGoalStatistics;
	error?: string;
}> => {
	try {
		const response = await POST(`goals/regular/${regularGoalId}/restart-after-completion`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// ========== FOLDER RULES API ==========

// Получить параметры для создания правил
export const getFolderRuleOptions = async (): Promise<{
	success: boolean;
	data?: IRuleOptions;
	error?: string;
}> => {
	try {
		const response = await GET('goals/folders/rules/options', {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Создать правило папки
export const createFolderRule = async (
	folderId: number,
	data: Partial<IGoalFolderRule>
): Promise<{
	success: boolean;
	data?: IGoalFolderRule;
	error?: string;
}> => {
	try {
		// Создаем базовый объект с обязательными полями
		const body: any = {
			rule_type: data.ruleType,
			is_active: data.isActive ?? true,
		};

		// Добавляем поля только если они нужны для данного типа правила
		if (data.category !== undefined) body.category = data.category;
		if (data.complexity !== undefined) body.complexity = data.complexity;
		if (data.keywords !== undefined) body.keywords = data.keywords;
		if (data.removeFromFolder !== undefined) body.remove_from_folder = data.removeFromFolder;

		// Добавляем числовые параметры только для соответствующих типов правил
		if (data.ruleType === 'ON_DEADLINE_APPROACHING_ADD' && data.daysBeforeDeadline !== undefined) {
			body.days_before_deadline = data.daysBeforeDeadline;
		}
		if (data.ruleType === 'ON_HIGH_PROGRESS_ADD' && data.progressThreshold !== undefined) {
			body.progress_threshold = data.progressThreshold;
		}
		if (data.ruleType === 'ON_STALLED_PROGRESS_ADD' && data.daysWithoutProgress !== undefined) {
			body.days_without_progress = data.daysWithoutProgress;
		}

		const response = await POST(`goals/folders/${folderId}/rules/create`, {
			body,
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Обновить правило папки
export const updateFolderRule = async (
	folderId: number,
	ruleId: number,
	data: Partial<IGoalFolderRule>
): Promise<{
	success: boolean;
	data?: IGoalFolderRule;
	error?: string;
}> => {
	try {
		// Создаем базовый объект с обязательными полями
		const body: any = {
			rule_type: data.ruleType,
			is_active: data.isActive ?? true,
		};

		// Добавляем поля только если они нужны для данного типа правила
		if (data.category !== undefined) body.category = data.category;
		if (data.complexity !== undefined) body.complexity = data.complexity;
		if (data.keywords !== undefined) body.keywords = data.keywords;
		if (data.removeFromFolder !== undefined) body.remove_from_folder = data.removeFromFolder;

		// Добавляем числовые параметры только для соответствующих типов правил
		if (data.ruleType === 'ON_DEADLINE_APPROACHING_ADD' && data.daysBeforeDeadline !== undefined) {
			body.days_before_deadline = data.daysBeforeDeadline;
		}
		if (data.ruleType === 'ON_HIGH_PROGRESS_ADD' && data.progressThreshold !== undefined) {
			body.progress_threshold = data.progressThreshold;
		}
		if (data.ruleType === 'ON_STALLED_PROGRESS_ADD' && data.daysWithoutProgress !== undefined) {
			body.days_without_progress = data.daysWithoutProgress;
		}

		const response = await PUT(`goals/folders/${folderId}/rules/${ruleId}/update`, {
			body,
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Удалить правило папки
export const deleteFolderRule = async (
	folderId: number,
	ruleId: number
): Promise<{
	success: boolean;
	error?: string;
}> => {
	try {
		const response = await DELETE(`goals/folders/${folderId}/rules/${ruleId}/delete`, {
			auth: true,
		});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};
