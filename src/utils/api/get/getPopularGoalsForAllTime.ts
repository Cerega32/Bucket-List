import {GET} from '@/utils/fetch/requests';

export const getPopularGoalsForAllTime = async () => {
	const response = await GET('goals/popular/all-time', {auth: true});
	return response;
};
