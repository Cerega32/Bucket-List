import {DELETE} from '@/utils/fetch/requests';

export const deleteGoal = async (code: string): Promise<{success: boolean; data?: any; error?: string}> => {
	try {
		const response = await DELETE(`goals/${code}/delete`, {
			auth: true,
			success: {
				type: 'success',
				title: 'Успех',
				message: 'Цель успешно удалена',
			},
		});

		return response;
	} catch (error) {
		console.error('API Error:', error);
		return {
			success: false,
			error: 'Не удалось удалить цель',
		};
	}
};
