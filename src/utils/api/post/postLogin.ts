import {POST} from '@/utils/fetch/requests';

export const postLogin = async (email: string, password: string) => {
	const response = await POST('login', {email, password});
	return response;
};
