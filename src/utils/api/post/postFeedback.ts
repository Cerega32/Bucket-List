import {POST} from '@/utils/fetch/requests';

import type {IAchievement} from '@/typings/achievements';

export interface FeedbackPayload {
	rating: number;
	message: string;
}

export interface FeedbackResponse {
	success: boolean;
	newAchievements?: IAchievement[];
}

export const postFeedback = async (data: FeedbackPayload) => {
	return POST('feedback', {
		auth: true,
		body: data,
	}) as Promise<{success: boolean; data?: FeedbackResponse; errors?: string}>;
};
