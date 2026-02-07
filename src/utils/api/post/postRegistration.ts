import {POST} from '@/utils/fetch/requests';

export const postRegistration = async (email: string, password: string, username: string) => {
	const response = await POST('register', {
		body: {email, password, username},
		showErrorNotification: false,
	});
	return response;
};
