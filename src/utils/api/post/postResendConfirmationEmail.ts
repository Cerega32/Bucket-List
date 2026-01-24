import {POST} from '@/utils/fetch/requests';

export const postResendConfirmationEmail = async () => {
	const response = await POST('resend-confirmation-email', {
		auth: true,
		showErrorNotification: true,
	});
	return response;
};
