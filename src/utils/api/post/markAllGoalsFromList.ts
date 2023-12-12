import {POST} from '@/utils/fetch/requests';

export const markAllGoalsFromList = async (code: string) => {
	const response = await POST(`goal-lists/${code}/mark-all`, {auth: true});
	return response;
};
