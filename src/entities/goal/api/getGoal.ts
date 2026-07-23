import {GET} from '@/shared/api/http/requests';

export const getGoal = async (url: string) => {
	const response = await GET(`goals/${url}`, {auth: true});
	return response;
};
