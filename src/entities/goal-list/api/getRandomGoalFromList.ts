import {GET} from '@/shared/api/http/requests';

export const getRandomGoalFromList = async (code: string) => {
	const response = await GET(`goal-lists/${code}/random-goal`, {auth: true});
	return response;
};
