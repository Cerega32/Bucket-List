import {GET} from '@/utils/fetch/requests';

export const checkUsername = async (username: string) => {
	const response = await GET('check-username', {
		get: {username},
	});
	return response;
};
