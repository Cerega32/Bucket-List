import {IGoal} from '@/typings/goal';
import {POST} from '@/utils/fetch/requests';

interface RegularGoalSettings {
	frequency: 'daily' | 'weekly' | 'custom';
	weeklyFrequency?: number;
	customSchedule?: any;
	durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
	durationValue?: number;
	endDate?: string;
	allowSkipDays: number;
	resetOnSkip: boolean;
}

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

/**
 * Добавляет регулярную цель пользователю с индивидуальными настройками
 */
export const addRegularGoalToUser = (goalCode: string, settings: RegularGoalSettings & {goal_code: string}) => {
	const data = {
		goal_code: goalCode,
		frequency: settings.frequency,
		weekly_frequency: settings.weeklyFrequency,
		custom_schedule: settings.customSchedule,
		duration_type: settings.durationType,
		duration_value: settings.durationValue,
		end_date: settings.endDate,
		allow_skip_days: settings.allowSkipDays,
		reset_on_skip: settings.resetOnSkip,
	};
	// Удаляем undefined значения
	const cleanData = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

	return POST(`goals/${goalCode}/add-regular`, {
		auth: true,
		body: cleanData,
	});
};
