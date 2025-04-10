import {DELETE} from '@/utils/fetch/requests';

export interface DeleteGoalTimerResponse {
	success: boolean;
	message?: string;
}

/**
 * Удаляет таймер для цели
 * @param goalCode - код цели
 * @returns Ответ с сообщением об успехе или ошибке
 */
export const deleteGoalTimer = async (goalCode: string): Promise<DeleteGoalTimerResponse> => {
	try {
		const response = await DELETE(`timer/${goalCode}/delete/`, {
			auth: true,
			showSuccessNotification: false,
			showErrorNotification: false,
		});

		if (response.success) {
			return {
				success: true,
				message: response.data.message || 'Срок выполнения удален',
			};
		}

		return {
			success: false,
			message: response.errors || 'Не удалось удалить срок выполнения',
		};
	} catch (error) {
		console.error('Error deleting goal timer:', error);
		return {
			success: false,
			message: 'Произошла ошибка при удалении срока выполнения',
		};
	}
};
