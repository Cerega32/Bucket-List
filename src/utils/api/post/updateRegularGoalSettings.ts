import {WeekDaySchedule} from '@/components/WeekDaySelector/WeekDaySelector';
import {IGoal} from '@/typings/goal';
import {PUT} from '@/utils/fetch/requests';

export interface RegularGoalSettings {
	frequency: 'daily' | 'weekly' | 'custom';
	weeklyFrequency?: number;
	customSchedule?: WeekDaySchedule;
	durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
	durationValue?: number;
	endDate?: string;
	allowSkipDays: number;
	resetOnSkip: boolean;
}

// Тип для данных запроса на сервер (snake_case)
type UpdateRegularGoalRequestData =
	| {
			goal_code: string;
			frequency: 'daily';
			duration_type: 'days' | 'weeks';
			duration_value: number;
			allow_skip_days: number;
			days_for_earned_skip: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'daily';
			duration_type: 'until_date';
			end_date: string;
			allow_skip_days: number;
			days_for_earned_skip: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'daily';
			duration_type: 'indefinite';
			allow_skip_days: number;
			days_for_earned_skip: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'weekly';
			weekly_frequency: number;
			duration_type: 'days' | 'weeks';
			duration_value: number;
			allow_skip_days: number;
			days_for_earned_skip: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'weekly';
			weekly_frequency: number;
			duration_type: 'until_date';
			end_date: string;
			allow_skip_days: number;
			days_for_earned_skip: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'weekly';
			weekly_frequency: number;
			duration_type: 'indefinite';
			allow_skip_days: number;
			days_for_earned_skip: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'custom';
			custom_schedule: WeekDaySchedule;
			duration_type: 'days' | 'weeks';
			duration_value: number;
			allow_skip_days: number;
			days_for_earned_skip: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'custom';
			custom_schedule: WeekDaySchedule;
			duration_type: 'until_date';
			end_date: string;
			allow_skip_days: number;
			days_for_earned_skip: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'custom';
			custom_schedule: WeekDaySchedule;
			duration_type: 'indefinite';
			allow_skip_days: number;
			days_for_earned_skip: number;
			reset_on_skip: boolean;
	  };

interface UserRegularGoal {
	id: number;
	user: number;
	goal: number;
	goalData: {
		id: number;
		title: string;
		code: string;
		image?: string;
		category?: {
			id: number;
			name: string;
		};
	};
	originalRegularGoal: number;
	originalRegularGoalData: RegularGoalSettings;
	frequency: string;
	weeklyFrequency?: number;
	customSchedule?: any;
	durationType: string;
	durationValue?: number;
	endDate?: string;
	allowSkipDays: number;
	resetOnSkip: boolean;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface UpdateRegularGoalResponse {
	goal: IGoal;
	user_regular_goal: UserRegularGoal;
	statistics?: any;
}

interface ApiResponse {
	success: boolean;
	data?: UpdateRegularGoalResponse;
	error?: string;
	errors?: any;
	message?: string;
}

/**
 * Обновляет индивидуальные настройки регулярной цели пользователя
 */
export const updateRegularGoalSettings = async (goalCode: string, settings: RegularGoalSettings): Promise<ApiResponse> => {
	// Базовые поля, которые всегда присутствуют
	const baseFields = {
		goal_code: goalCode, // Добавляем goal_code, так как сериализатор требует это поле
		frequency: settings.frequency,
		duration_type: settings.durationType,
		allow_skip_days: settings.allowSkipDays,
		days_for_earned_skip: 0, // По умолчанию 0, так как в форме этого поля нет
		reset_on_skip: settings.resetOnSkip,
	};

	// Создаем объект данных в зависимости от комбинации frequency и duration_type
	let data: UpdateRegularGoalRequestData;

	if (settings.frequency === 'daily') {
		if (settings.durationType === 'days' || settings.durationType === 'weeks') {
			if (settings.durationValue === undefined) {
				throw new Error('durationValue is required when durationType is days or weeks');
			}
			data = {
				...baseFields,
				duration_value: settings.durationValue,
			} as UpdateRegularGoalRequestData;
		} else if (settings.durationType === 'until_date') {
			if (!settings.endDate) {
				throw new Error('endDate is required when durationType is until_date');
			}
			data = {
				...baseFields,
				end_date: settings.endDate,
			} as UpdateRegularGoalRequestData;
		} else {
			// indefinite
			data = baseFields as UpdateRegularGoalRequestData;
		}
	} else if (settings.frequency === 'weekly') {
		if (settings.weeklyFrequency === undefined) {
			throw new Error('weeklyFrequency is required when frequency is weekly');
		}
		if (settings.durationType === 'days' || settings.durationType === 'weeks') {
			if (settings.durationValue === undefined) {
				throw new Error('durationValue is required when durationType is days or weeks');
			}
			data = {
				...baseFields,
				weekly_frequency: settings.weeklyFrequency,
				duration_value: settings.durationValue,
			} as UpdateRegularGoalRequestData;
		} else if (settings.durationType === 'until_date') {
			if (!settings.endDate) {
				throw new Error('endDate is required when durationType is until_date');
			}
			data = {
				...baseFields,
				weekly_frequency: settings.weeklyFrequency,
				end_date: settings.endDate,
			} as UpdateRegularGoalRequestData;
		} else {
			// indefinite
			data = {
				...baseFields,
				weekly_frequency: settings.weeklyFrequency,
			} as UpdateRegularGoalRequestData;
		}
	} else {
		// frequency === 'custom'
		if (!settings.customSchedule || Object.keys(settings.customSchedule).length === 0) {
			throw new Error('customSchedule is required when frequency is custom');
		}
		if (settings.durationType === 'days' || settings.durationType === 'weeks') {
			if (settings.durationValue === undefined) {
				throw new Error('durationValue is required when durationType is days or weeks');
			}
			data = {
				...baseFields,
				custom_schedule: settings.customSchedule,
				duration_value: settings.durationValue,
			} as UpdateRegularGoalRequestData;
		} else if (settings.durationType === 'until_date') {
			if (!settings.endDate) {
				throw new Error('endDate is required when durationType is until_date');
			}
			data = {
				...baseFields,
				custom_schedule: settings.customSchedule,
				end_date: settings.endDate,
			} as UpdateRegularGoalRequestData;
		} else {
			// indefinite
			data = {
				...baseFields,
				custom_schedule: settings.customSchedule,
			} as UpdateRegularGoalRequestData;
		}
	}

	const response = await PUT(`goals/${goalCode}/update-regular-settings`, {
		auth: true,
		body: data,
	});

	return {
		success: response.success || false,
		data: response.data as UpdateRegularGoalResponse | undefined,
		error: response.errors || response.error || undefined,
		message: response.message || undefined,
	};
};
