import {POST} from '@/utils/fetch/requests';

export const removeGoal = async (code: string) => {
	const response = await POST(`goals/${code}/remove`, {auth: true});
	return response;
};
