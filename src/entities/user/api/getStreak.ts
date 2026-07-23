import {GET} from '@/shared/api/http/requests';

export const getStreak = async () => {
	const response = await GET('streak', {auth: true});
	return response;
};
