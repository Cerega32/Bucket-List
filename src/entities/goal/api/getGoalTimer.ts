import {GET} from '@/shared/api/http/requests';

export interface TimerInfo {
	deadline: string;
	daysLeft: number;
	isExpired: boolean;
	goal: {
		code: string;
		title: string;
		image?: string;
	};
}

/**
 * Получает информацию о таймере (дедлайне) для конкретной цели
 *
 * @param goalCode - код цели
 * @returns результат запроса с данными таймера
 */
export const getGoalTimer = async (goalCode: string) => {
	try {
		// Используем новый API-метод для получения таймера конкретной цели
		const response = await GET(`timer/${goalCode}/get`, {
			auth: true,
			showSuccessNotification: false,
			showErrorNotification: false,
		});

		return response;
	} catch (error) {
		console.error('Error getting goal timer:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка при получении таймера',
		};
	}
};

/**
 * Получает все таймеры пользователя, отсортированные по приближению дедлайна
 *
 * @param includeExpired - включать ли истекшие таймеры
 * @returns результат запроса со списком таймеров
 */
export const getUserTimers = async (options: {includeExpired?: boolean; expiredOnly?: boolean} = {}) => {
	const {includeExpired = false, expiredOnly = false} = options;

	try {
		const response = await GET('timers', {
			auth: true,
			get: {
				include_expired: includeExpired.toString(),
				expired_only: expiredOnly.toString(),
			},
			showSuccessNotification: false,
			showErrorNotification: false,
		});

		// Данные уже отсортированы на сервере и содержат days_left и is_expired
		return response;
	} catch (error) {
		console.error('Error getting user timers:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка при получении таймеров',
		};
	}
};
