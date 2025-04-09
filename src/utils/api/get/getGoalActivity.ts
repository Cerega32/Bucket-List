import {GET} from '@/utils/fetch/requests';

export const getGoalActivity = async (
	period: 'year' | 'halfyear' | 'quarter' | 'month' = 'year'
): Promise<{success: boolean; data: any}> => {
	try {
		// Используем существующую функцию GET
		const response = await GET('users/activity', {
			auth: true, // Требуется аутентификация
			get: {period}, // Параметры GET-запроса
			showErrorNotification: true,
			showSuccessNotification: false, // Не показываем уведомление об успехе
		});

		return response;
	} catch (error) {
		// Просто возвращаем объект с ошибкой вместо моковых данных
		return {
			success: false,
			errors: 'Не удалось загрузить данные активности',
		};
	}
};
