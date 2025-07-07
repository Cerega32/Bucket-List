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
	DELETE(`goals/folders/${folderId}/remove-goal/${goalId}`, {
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
export const getRegularGoalStatistics = async (): Promise<{
	success: boolean;
	data?: IRegularGoalStatistics[];
	error?: string;
}> => {
	try {
		const response = await GET('goals/regular/statistics', {
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

// Сбросить прогресс регулярной цели
export const resetRegularGoal = async (
	regularGoalId: number
): Promise<{
	success: boolean;
	data?: IRegularGoalStatistics;
	error?: string;
}> => {
	try {
		const response = await POST(`goals/regular/${regularGoalId}/reset`, {
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
