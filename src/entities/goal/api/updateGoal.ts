import {IGoal} from '@/entities/goal/model/types';
import {PUT} from '@/shared/api/http/requests';

export const updateGoal = async (code: string, formData: FormData): Promise<{success: boolean; data?: IGoal; error?: string}> => {
	try {
		const response = await PUT(`goals/${code}/update`, {
			auth: true,
			file: true,
			body: formData,
			success: {
				type: 'success',
				title: 'Успех',
				message: 'Цель успешно обновлена',
			},
		});

		return response;
	} catch (error) {
		console.error('API Error:', error);
		return {
			success: false,
			error: 'Не удалось обновить цель',
		};
	}
};
