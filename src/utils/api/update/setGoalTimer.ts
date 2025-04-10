import {TimerInfo} from '@/utils/api/get/getGoalTimer';
import {PUT} from '@/utils/fetch/requests';

export interface SetGoalTimerResponse {
	success: boolean;
	message?: string;
	timer?: TimerInfo;
}

/**
 * Устанавливает или обновляет таймер для цели
 * @param goalCode - код цели
 * @param deadline - дата дедлайна в формате YYYY-MM-DD
 * @returns Ответ с информацией о таймере или сообщением об ошибке
 */
export const setGoalTimer = async (goalCode: string, deadline: string): Promise<SetGoalTimerResponse> => {
	try {
		// Убедимся, что дата в правильном формате (YYYY-MM-DD)
		// Если передана полная дата с временем, обрезаем ее до даты
		const formattedDeadline = deadline.includes('T') ? deadline.split('T')[0] : deadline;

		const response = await PUT(`timer/${goalCode}/`, {
			auth: true,
			body: {deadline: formattedDeadline},
			showSuccessNotification: false,
			showErrorNotification: false,
		});

		if (response.success && response.data?.timer) {
			// Преобразуем данные в формат TimerInfo
			const timerData = response.data.timer;

			return {
				success: true,
				timer: {
					...timerData,
					goal: {
						code: goalCode,
						title: timerData.goal_title || '',
						image: timerData.goal_image,
					},
				},
				message: response.data.message || 'Срок успешно установлен',
			};
		}

		return {
			success: false,
			message: response.errors || 'Не удалось установить срок выполнения',
		};
	} catch (error) {
		console.error('Error setting goal timer:', error);
		return {
			success: false,
			message: 'Произошла ошибка при установке срока выполнения',
		};
	}
};
