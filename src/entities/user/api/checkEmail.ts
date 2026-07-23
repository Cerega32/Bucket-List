import {GET} from '@/shared/api/http/requests';

export const checkEmail = async (email: string) => {
	const response = await GET('check-email', {
		get: {email},
	});
	return response;
};
