import {POST} from '@/shared/api/http/requests';
import {LEGAL_POLICY_VERSION} from '@/shared/config/legal/documentsVersion';

export const postRegistration = async (email: string, password: string, username: string) => {
	const response = await POST('register', {
		body: {
			email,
			password,
			username,
			privacy_consent: true,
			policy_version: LEGAL_POLICY_VERSION,
		},
		showErrorNotification: false,
	});
	return response;
};
