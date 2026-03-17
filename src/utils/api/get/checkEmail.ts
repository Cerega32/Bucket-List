import {GET} from '@/utils/fetch/requests';

export const checkEmail = async (email: string) => {
	const response = await GET('check-email', {
		get: {email},
	});
	return response;
};
