import {POST} from '@/shared/api/http/requests';

export const removeListGoal = async (code: string) => {
	const response = await POST(`goal-lists/${code}/remove`, {auth: true});
	return response;
};
