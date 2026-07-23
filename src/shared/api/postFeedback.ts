import {POST} from '@/shared/api/http/requests';

export interface FeedbackPayload {
	rating: number;
	message: string;
}

export interface FeedbackResponse {
	success: boolean;
	/** Элементы имеют форму `IAchievement` из `entities/achievement` — вызывающая сторона сама делает cast. */
	newAchievements?: unknown[];
}

export const postFeedback = async (data: FeedbackPayload) => {
	return POST('feedback', {
		auth: true,
		body: data,
	}) as Promise<{success: boolean; data?: FeedbackResponse; errors?: string}>;
};
