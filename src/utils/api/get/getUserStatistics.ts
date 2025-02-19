import {GET} from '@/utils/fetch/requests';

export const getStatistics = async () => {
	const response = await GET('statistics', {auth: true});

	return response;
};
