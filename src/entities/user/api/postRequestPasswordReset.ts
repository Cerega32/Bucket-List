import {POST} from '@/shared/api/http/requests';

export const postRequestPasswordReset = async (email: string) => {
	const response = await POST('request-password-reset', {
		body: {email},
		showErrorNotification: true,
	});
	return response;
};
