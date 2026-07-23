import {POST} from '@/shared/api/http/requests';

export const addGoal = async (code: string) => {
	const response = await POST(`goals/${code}/add`, {auth: true});
	return response;
};
