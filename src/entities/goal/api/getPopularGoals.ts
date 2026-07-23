import {GET} from '@/shared/api/http/requests';

export const getPopularGoals = async (category: string) => {
	const response = await GET(`goals/${category}/popular`, {auth: true});
	return response;
};
