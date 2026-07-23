import {IList} from '@/entities/goal-list/model/types';
import {PUT} from '@/shared/api/http/requests';
import {ApiResponse} from '@/shared/types/api';

export const updateGoalList = async (code: string, data: FormData): Promise<ApiResponse<IList>> => {
	return PUT(`goal-lists/${code}/update`, {
		auth: true,
		file: true,
		body: data,
		showSuccessNotification: false,
		error: {
			type: 'error',
			title: 'Ошибка',
			message: 'Не удалось обновить список целей',
		},
	});
};
