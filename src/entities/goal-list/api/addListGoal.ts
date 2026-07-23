import {POST} from '@/shared/api/http/requests';

export const addListGoal = async (code: string) => {
	const response = await POST(`goal-lists/${code}/add`, {auth: true});
	return response;
};
