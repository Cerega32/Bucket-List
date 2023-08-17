import {GET} from '@/utils/fetch/requests';

export const getGoal = async (url) => {
	const response = await GET(url, true);
	return response;
};
