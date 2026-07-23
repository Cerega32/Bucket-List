import {GET} from '@/shared/api/http/requests';

export const getWeeklyLeaders = async () => {
	const response = await GET('leaders/weekly');
	return response;
};
