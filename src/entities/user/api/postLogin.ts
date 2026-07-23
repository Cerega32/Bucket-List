import {POST} from '@/shared/api/http/requests';

export const postLogin = async (email: string, password: string) => {
	const response = await POST('login', {body: {email, password}, showErrorNotification: false});
	return response;
};
