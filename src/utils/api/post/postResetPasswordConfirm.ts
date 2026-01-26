import {POST} from '@/utils/fetch/requests';

export const postResetPasswordConfirm = async (data: {uid: string; token: string; new_password: string}) => {
	const response = await POST('reset-password-confirm', {
		body: data,
		showErrorNotification: true,
		showSuccessNotification: true,
	});
	return response;
};
