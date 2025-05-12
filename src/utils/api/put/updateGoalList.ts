import {ApiResponse} from '@/typings/api';
import {IList} from '@/typings/list';
import {PUT} from '@/utils/fetch/requests';

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
