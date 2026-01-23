import {GET} from '@/utils/fetch/requests';

interface RegularSettings {
	id: number;
	frequency: 'daily' | 'weekly' | 'custom';
	weeklyFrequency?: number;
	customSchedule?: any;
	durationType: 'days' | 'weeks' | 'until_date' | 'indefinite';
	durationValue?: number;
	endDate?: string;
	allowSkipDays: number;
	resetOnSkip: boolean;
	allowCustomSettings: boolean;
}

interface RegularGoalData {
	id: number;
	title: string;
	code: string;
	image?: string;
	category?: {
		id: number;
		name: string;
	};
}

export interface RegularGoalSettingsResponse {
	goal: RegularGoalData;
	regular_settings: RegularSettings;
}

/**
 * Получает настройки регулярности для цели
 */
export const getRegularGoalSettings = async (goalCode: string) => {
	const res = await GET(`goals/${goalCode}/regular-settings`);
	if (!res.success) return res;
	// Бэкенд возвращает { success: true, data: { goal, regular_settings } }
	// Преобразуем, чтобы в res.data сразу лежал { goal, regular_settings }
	const payload = res.data?.data ?? res.data;
	return {success: true, data: payload};
};
