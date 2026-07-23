import {POST} from '@/shared/api/http/requests';

interface CreateGoalResponse {
	success: boolean;
	data?: any;
	error?: string;
}

export const postCreateGoal = async (formData: FormData): Promise<CreateGoalResponse> => {
	const res = await POST('goals/create', {body: formData, file: true, auth: true});

	return res;
};
