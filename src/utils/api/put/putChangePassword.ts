import {PUT} from '@/utils/fetch/requests';

export const putChangePassword = async (passwords) => {
	const response = await PUT('users/change-password', {body: passwords, auth: true});
	return response;
};
