import {GET} from '@/shared/api/http/requests';

export const getRandomActiveGoal = async (excludeCode?: string) => {
	const response = await GET('dashboard/random-active-goal', {
		auth: true,
		get: excludeCode ? {exclude: excludeCode} : undefined,
	});

	return response;
};
