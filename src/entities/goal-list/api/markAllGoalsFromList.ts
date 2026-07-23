import {POST} from '@/shared/api/http/requests';

export const markAllGoalsFromList = async (code: string) => {
	const response = await POST(`goal-lists/${code}/mark-all`, {auth: true});
	return response;
};
