import {GET} from '@/utils/fetch/requests';

export const getGoal = async (url: string) => {
	const response = await GET(url, {auth: true});
	return response;
};
