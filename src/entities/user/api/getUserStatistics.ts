import {GET} from '@/shared/api/http/requests';

export const getStatistics = async () => {
	const response = await GET('statistics', {auth: true});

	return response;
};
