import {GET} from '@/utils/fetch/requests';

export const getWeeklyLeaders = async () => {
	const response = await GET('leaders/weekly');
	return response;
};
