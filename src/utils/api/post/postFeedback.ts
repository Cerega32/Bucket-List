import {POST} from '@/utils/fetch/requests';

export interface FeedbackPayload {
	rating: number;
	message: string;
}

export const postFeedback = async (data: FeedbackPayload) => {
	return POST('feedback', {
		auth: true,
		body: data,
	});
};
