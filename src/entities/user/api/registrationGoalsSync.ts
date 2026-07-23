import {POST} from '@/shared/api/http/requests';

interface RegistrationGoalsSyncParams {
	add_codes: Array<string>;
	mark_codes: Array<string>;
}

export const registrationGoalsSync = async (params: RegistrationGoalsSyncParams) => {
	const response = await POST('goals/registration-sync', {
		auth: true,
		body: params,
		showErrorNotification: false,
	});
	return response;
};
