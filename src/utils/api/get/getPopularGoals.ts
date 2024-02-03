import {GET} from '@/utils/fetch/requests';

export const getPopularGoals = async (category: string) => {
	const response = await GET(`goals/${category}/popular`, {auth: true});
	return response;
};
