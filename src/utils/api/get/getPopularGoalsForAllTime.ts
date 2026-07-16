import {GET} from '@/utils/fetch/requests';

export const getPopularGoalsForAllTime = async (limit?: number) => {
	const response = await GET('goals/popular/all-time', {
		auth: true,
		get: limit ? {limit} : undefined,
	});
	return response;
};
