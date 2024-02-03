import {POST} from '@/utils/fetch/requests';

export const postRegistration = async (email: string, password: string) => {
	const response = await POST('register', {
		body: {email, password},
	});
	return response;
};
