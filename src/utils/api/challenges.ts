import {GET, POST} from '@/utils/fetch/requests';

// ========== CHALLENGES API ==========

export interface IDailyChallenge {
	id: number;
	challengeType: ChallengeType;
	title: string;
	description: string;
	targetValue: number;
	experienceReward: number;
	difficulty: ChallengeDifficulty;
	isActive: boolean;
	createdAt: string;
}

export interface IWeeklyChallengeItem {
	id: number;
	dailyChallenge: IDailyChallenge;
	targetValue: number;
	currentProgress: number;
	isCompleted: boolean;
	completedAt: string | null;
}

export interface IWeeklyChallenge {
	id: number;
	weekStart: string;
	weekEnd: string;
	totalExperience: number;
	completedChallenges: number;
	bonusEarned?: boolean;
	isCompleted: boolean;
	items: IWeeklyChallengeItem[];
}

export interface IUserChallengeProgress {
	id: number;
	challengeType: ChallengeType;
	currentValue: number;
	lastUpdated: string;
}

export type ChallengeType =
	| 'complete_goals'
	| 'add_goals'
	| 'comment_goals'
	| 'visit_profiles'
	| 'login_streak'
	| 'update_progress'
	| 'create_folder'
	| 'share_goal'
	| 'like_comments'
	| 'daily_goal_complete';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

// Константы для отображения
export const CHALLENGE_TYPES: Record<ChallengeType, string> = {
	complete_goals: 'Выполнить цели',
	add_goals: 'Добавить цели',
	comment_goals: 'Комментировать цели',
	visit_profiles: 'Посетить профили',
	login_streak: 'Серия входов',
	update_progress: 'Обновить прогресс',
	create_folder: 'Создать папки',
	share_goal: 'Поделиться целями',
	like_comments: 'Лайкнуть комментарии',
	daily_goal_complete: 'Выполнить ежедневные цели',
};

export const CHALLENGE_ICONS: Record<ChallengeType, string> = {
	complete_goals: 'check',
	add_goals: 'plus',
	comment_goals: 'comment',
	visit_profiles: 'user',
	login_streak: 'login',
	update_progress: 'progress',
	create_folder: 'folder',
	share_goal: 'share',
	like_comments: 'like',
	daily_goal_complete: 'calendar',
};

export const DIFFICULTY_COLORS: Record<ChallengeDifficulty, string> = {
	easy: 'green',
	medium: 'orange',
	hard: 'red',
};

export const DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
	easy: 'Легкое',
	medium: 'Среднее',
	hard: 'Сложное',
};

// ========== API FUNCTIONS ==========

/**
 * Получить текущий недельный вызов пользователя
 */
export const getCurrentWeekChallenge = async (): Promise<{
	success: boolean;
	data?: IWeeklyChallengeResponse;
	error?: string;
}> => {
	try {
		const response = await GET('challenges/current-week', {auth: true});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Получить все активные ежедневные вызовы
 */
export const getDailyChallenges = async (): Promise<{
	success: boolean;
	data?: IDailyChallenge[];
	error?: string;
}> => {
	try {
		const response = await GET('challenges/daily');
		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Получить прогресс пользователя по всем типам вызовов
 */
export const getUserChallengeProgress = async (): Promise<{
	success: boolean;
	data?: IUserChallengeProgress[];
	error?: string;
}> => {
	try {
		const response = await GET('challenges/progress');
		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Обновить прогресс пользователя по определенному типу вызова
 * @deprecated Прогресс теперь отслеживается автоматически на бэкенде
 */
export const updateChallengeProgress = async (
	challengeType?: ChallengeType
): Promise<{
	success: boolean;
	data?: IUserChallengeProgress;
	error?: string;
}> => {
	// Функция оставлена для обратной совместимости, но ничего не делает
	console.warn(
		'updateChallengeProgress is deprecated. Progress is now tracked automatically on backend.',
		challengeType ? `Challenge type: ${challengeType}` : ''
	);
	return {
		success: true,
		data: undefined,
	};
};

/**
 * Сбросить прогресс пользователя по определенному типу вызова
 */
export const resetChallengeProgress = async (
	challengeType: ChallengeType
): Promise<{
	success: boolean;
	error?: string;
}> => {
	try {
		await POST('challenges/reset-progress', {
			auth: true,
			body: {
				challenge_type: challengeType,
			},
		});
		return {
			success: true,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Получить статистику по вызовам пользователя
 */
export const getChallengeStats = async (): Promise<{
	success: boolean;
	data?: {
		total_experience: number;
		completed_challenges: number;
		current_streak: number;
		best_streak: number;
	};
	error?: string;
}> => {
	try {
		const response = await GET('challenges/stats');
		return {
			success: true,
			data: response,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Автоматическое обновление прогресса daily_goal_complete при выполнении ежедневных целей
 * Эта функция вызывается автоматически при выполнении целей с установленным daily_goal
 */
export const updateDailyGoalComplete = async (): Promise<void> => {
	try {
		await updateChallengeProgress('daily_goal_complete');
	} catch (error) {
		// Тихо игнорируем ошибки, чтобы не нарушать основной функционал
		console.warn('Не удалось обновить прогресс daily_goal_complete:', error);
	}
};

// ========== НОВАЯ СИСТЕМА ЕЖЕНЕДЕЛЬНЫХ ЗАДАНИЙ ==========

export interface IChallengeCategory {
	id: number;
	name: string;
	icon: string;
	color: string;
	description: string;
}

export interface IChallengeTemplate {
	id: number;
	title: string;
	description: string;
	category: IChallengeCategory;
	challengeType: 'general' | 'personal' | 'manual';
	challengeTypeDisplay: string;
	difficulty: 'easy' | 'medium' | 'hard';
	difficultyDisplay: string;
	triggerType: string;
	triggerTypeDisplay: string;
	targetValue: number;
	experienceReward: number;
	isActive: boolean;
	isRepeatable: boolean;
	weight: number;
}

export interface IWeeklyChallengeItemNew {
	id: number;
	template: IChallengeTemplate;
	targetValue: number;
	currentProgress: number;
	isCompleted: boolean;
	completedAt: string | null;
	progressPercentage: number;
	canMarkManually: boolean;
	trackingData: Record<string, any>;
}

export interface IWeeklyChallengeNew {
	id: number;
	weekStart: string;
	weekEnd: string;
	totalExperience: number;
	completedChallenges: number;
	isCompleted: boolean;
	bonusEarned: boolean;
	items: IWeeklyChallengeItemNew[];
	completionPercentage: number;
	daysRemaining: number;
	weekStatus: 'active' | 'completed' | 'expired' | 'upcoming';
	createdAt: string;
}

export interface IChallengeStats {
	totalWeeks: number;
	completedWeeks: number;
	totalChallenges: number;
	completedChallenges: number;
	totalExperience: number;
	completionRate: number;
}

/**
 * Получить задания текущей недели
 */
export const getCurrentWeekChallenges = async (): Promise<{
	success: boolean;
	data?: IWeeklyChallengeNew;
	error?: string;
}> => {
	try {
		const response = await GET('challenges/current-week', {auth: true});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Отметить ручное задание как выполненное
 */
export const markManualChallengeCompleted = async (
	itemId: number
): Promise<{
	success: boolean;
	data?: IWeeklyChallengeItemNew;
	error?: string;
}> => {
	try {
		const response = await POST(`challenges/mark-manual/${itemId}`, {auth: true});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Получить историю заданий
 */
export const getChallengeHistory = async (): Promise<{
	success: boolean;
	data?: IWeeklyChallengeNew[];
	error?: string;
}> => {
	try {
		const response = await GET('challenges/history', {auth: true});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

/**
 * Получить статистику заданий
 */
export const getNewChallengeStats = async (): Promise<{
	success: boolean;
	data?: IChallengeStats;
	error?: string;
}> => {
	try {
		const response = await GET('challenges/stats', {auth: true});
		return response;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка',
		};
	}
};

// Интерфейс для ответа API (старая система - для обратной совместимости)
export interface IWeeklyChallengeResponse {
	weeklyChallenge: IWeeklyChallenge;
	challengeItems: IWeeklyChallengeItem[];
}
