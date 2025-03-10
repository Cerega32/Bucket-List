import {GET} from '@/utils/fetch/requests';

export const getStreak = async () => {
	const response = await GET('streak', {auth: true});
	return response;
};
