import {POST} from '@/utils/fetch/requests';

export const removeListGoal = async (code: string) => {
	const response = await POST(`goal-lists/${code}/remove`, {auth: true});
	return response;
};
