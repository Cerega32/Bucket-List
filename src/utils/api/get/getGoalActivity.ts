import {GET} from '@/utils/fetch/requests';

export interface GetGoalActivityOptions {
	period?: 'year' | 'halfyear' | 'quarter' | 'month';
	calendarYear?: number;
}

export const getGoalActivity = async (options: GetGoalActivityOptions = {}): Promise<{success: boolean; data?: any; errors?: string}> => {
	const {period = 'year', calendarYear} = options;

	try {
		const get: Record<string, string> = {period};
		if (calendarYear !== undefined) {
			get['calendar_year'] = String(calendarYear);
		}

		const response = await GET('users/activity', {
			auth: true,
			get,
			showErrorNotification: true,
			showSuccessNotification: false,
		});

		return response;
	} catch (error) {
		return {
			success: false,
			errors: 'Не удалось загрузить данные активности',
		};
	}
};
