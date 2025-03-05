import {POST} from '@/utils/fetch/requests';

export const postLogin = async (email: string, password: string, rememberMe: boolean) => {
	const response = await POST('login', {body: {email, password, remember_me: rememberMe}, showErrorNotification: false});
	return response;
};
