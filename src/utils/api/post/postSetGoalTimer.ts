import {PUT} from '@/utils/fetch/requests';

/**
 * Устанавливает таймер (дедлайн) для цели
 *
 * @param goalCode - код цели
 * @param deadline - дата дедлайна в формате YYYY-MM-DD
 * @returns результат запроса с данными таймера
 */
export const postSetGoalTimer = async (goalCode: string, deadline: string) => {
	try {
		const response = await PUT(`timer/${goalCode}/`, {
			auth: true,
			body: {deadline},
			showSuccessNotification: false,
			showErrorNotification: false,
		});

		return response;
	} catch (error) {
		console.error('Error setting goal timer:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка при установке таймера',
		};
	}
};
