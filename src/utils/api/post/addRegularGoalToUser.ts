import {WeekDaySchedule} from '@/components/WeekDaySelector/WeekDaySelector';
import {IGoal} from '@/typings/goal';
import {POST} from '@/utils/fetch/requests';

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
type AddRegularGoalRequestData =
	| {
			goal_code: string;
			frequency: 'daily';
			duration_type: 'days' | 'weeks';
			duration_value: number;
			allow_skip_days: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'daily';
			duration_type: 'until_date';
			end_date: string;
			allow_skip_days: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'daily';
			duration_type: 'indefinite';
			allow_skip_days: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'weekly';
			weekly_frequency: number;
			duration_type: 'days' | 'weeks';
			duration_value: number;
			allow_skip_days: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'weekly';
			weekly_frequency: number;
			duration_type: 'until_date';
			end_date: string;
			allow_skip_days: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'weekly';
			weekly_frequency: number;
			duration_type: 'indefinite';
			allow_skip_days: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'custom';
			custom_schedule: WeekDaySchedule;
			duration_type: 'days' | 'weeks';
			duration_value: number;
			allow_skip_days: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'custom';
			custom_schedule: WeekDaySchedule;
			duration_type: 'until_date';
			end_date: string;
			allow_skip_days: number;
			reset_on_skip: boolean;
	  }
	| {
			goal_code: string;
			frequency: 'custom';
			custom_schedule: WeekDaySchedule;
			duration_type: 'indefinite';
			allow_skip_days: number;
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

export interface AddRegularGoalResponse {
	goal: IGoal;
	user_regular_goal: UserRegularGoal;
}

interface ApiResponse {
	success: boolean;
	data?: AddRegularGoalResponse;
	error?: string;
	errors?: any;
}

/**
 * Добавляет регулярную цель пользователю с индивидуальными настройками
 */
export const addRegularGoalToUser = async (goalCode: string, settings: RegularGoalSettings): Promise<ApiResponse> => {
	// Базовые поля, которые всегда присутствуют
	const baseFields = {
		goal_code: goalCode,
		frequency: settings.frequency,
		duration_type: settings.durationType,
		allow_skip_days: settings.allowSkipDays,
		reset_on_skip: settings.resetOnSkip,
	};

	// Создаем объект данных в зависимости от комбинации frequency и duration_type
	let data: AddRegularGoalRequestData;

	if (settings.frequency === 'daily') {
		if (settings.durationType === 'days' || settings.durationType === 'weeks') {
			if (settings.durationValue === undefined) {
				throw new Error('durationValue is required when durationType is days or weeks');
			}
			data = {
				...baseFields,
				duration_value: settings.durationValue,
			} as AddRegularGoalRequestData;
		} else if (settings.durationType === 'until_date') {
			if (!settings.endDate) {
				throw new Error('endDate is required when durationType is until_date');
			}
			data = {
				...baseFields,
				end_date: settings.endDate,
			} as AddRegularGoalRequestData;
		} else {
			// indefinite
			data = baseFields as AddRegularGoalRequestData;
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
			} as AddRegularGoalRequestData;
		} else if (settings.durationType === 'until_date') {
			if (!settings.endDate) {
				throw new Error('endDate is required when durationType is until_date');
			}
			data = {
				...baseFields,
				weekly_frequency: settings.weeklyFrequency,
				end_date: settings.endDate,
			} as AddRegularGoalRequestData;
		} else {
			// indefinite
			data = {
				...baseFields,
				weekly_frequency: settings.weeklyFrequency,
			} as AddRegularGoalRequestData;
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
			} as AddRegularGoalRequestData;
		} else if (settings.durationType === 'until_date') {
			if (!settings.endDate) {
				throw new Error('endDate is required when durationType is until_date');
			}
			data = {
				...baseFields,
				custom_schedule: settings.customSchedule,
				end_date: settings.endDate,
			} as AddRegularGoalRequestData;
		} else {
			// indefinite
			data = {
				...baseFields,
				custom_schedule: settings.customSchedule,
			} as AddRegularGoalRequestData;
		}
	}

	const response = await POST(`goals/${goalCode}/add-regular`, {
		auth: true,
		body: data,
	});

	return {
		success: response.success || false,
		data: response.data as AddRegularGoalResponse | undefined,
		error: response.errors || response.error || undefined,
	};
};
