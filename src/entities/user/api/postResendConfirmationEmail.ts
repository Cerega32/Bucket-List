import {POST} from '@/shared/api/http/requests';

export const postResendConfirmationEmail = async () => {
	const response = await POST('resend-confirmation-email', {
		auth: true,
		showErrorNotification: true,
		showSuccessNotification: false,
	});
	return response;
};
