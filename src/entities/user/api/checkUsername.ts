import {GET} from '@/shared/api/http/requests';

export const checkUsername = async (username: string) => {
	const response = await GET('check-username', {
		get: {username},
	});
	return response;
};
