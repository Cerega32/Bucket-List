import {GET} from '@/utils/fetch/requests';

interface CanEditGoalResponse {
	can_edit: boolean;
	error?: string;
}

export const canEditGoal = async (code: string): Promise<{success: boolean; data?: CanEditGoalResponse; error?: string}> => {
	try {
		const response = await GET(`goals/${code}/can-edit`, {
			auth: true,
			showSuccessNotification: false,
		});

		return response;
	} catch (error) {
		console.error('API Error:', error);
		return {
			success: false,
			error: 'Не удалось проверить возможность редактирования',
		};
	}
};
