import {POST} from '@/utils/fetch/requests';

export const addListGoal = async (code: string) => {
	const response = await POST(`goal-lists/${code}/add`, {auth: true});
	return response;
};
