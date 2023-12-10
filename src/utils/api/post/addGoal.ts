import {POST} from '@/utils/fetch/requests';

export const addGoal = async (code: string) => {
	const response = await POST(`goals/${code}/add`, {auth: true});
	return response;
};
