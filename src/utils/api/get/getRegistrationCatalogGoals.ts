import {GET} from '@/utils/fetch/requests';

export const getRegistrationCatalogGoals = async (limit = 16) => {
	const response = await GET('goals/registration-catalog', {
		auth: true,
		get: {limit},
	});
	return response;
};
