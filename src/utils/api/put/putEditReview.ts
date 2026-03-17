import {IComment} from '@/typings/comments';
import {PUT} from '@/utils/fetch/requests';

interface EditReviewPayload {
	text: string;
	complexity: string;
	photosToDelete: number[];
	newPhotos: File[];
}

export const putEditReview = async (
	commentId: number,
	{text, complexity, photosToDelete, newPhotos}: EditReviewPayload
): Promise<{success: boolean; data?: IComment; error?: string}> => {
	const formData = new FormData();
	formData.append('text', text);
	formData.append('complexity', complexity);

	photosToDelete.forEach((id) => {
		formData.append('photos_to_delete', String(id));
	});

	newPhotos.forEach((file) => {
		formData.append('photo', file);
	});

	const response = await PUT(`comments/${commentId}/edit`, {
		auth: true,
		body: formData,
		file: true,
	});

	if (!response.success) {
		return {
			success: false,
			error: response.errors || 'Ошибка редактирования отзыва',
		};
	}

	return {
		success: true,
		data: response.data as IComment,
	};
};
