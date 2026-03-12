import {DELETE} from '@/utils/fetch/requests';

export const deleteReview = async (commentId: number): Promise<{success: boolean; error?: string}> => {
	const response = await DELETE(`comments/${commentId}/delete`, {
		auth: true,
		success: {
			type: 'success',
			title: 'Отзыв удален',
			message: 'Ваш отзыв успешно удален',
		},
	});

	if (!response.success) {
		return {
			success: false,
			error: response.errors || 'Ошибка удаления отзыва',
		};
	}

	return {success: true};
};
