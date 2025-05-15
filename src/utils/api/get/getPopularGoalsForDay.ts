import {GET} from '@/utils/fetch/requests';

export const getPopularGoalsForDay = async () => {
	const response = await GET('goals/popular/day', {auth: true});
	return response;
};
