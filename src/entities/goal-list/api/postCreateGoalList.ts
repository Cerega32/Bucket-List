import {POST} from '@/shared/api/http/requests';
import {ApiResponse} from '@/shared/types/api';

// interface CreateGoalListResponse {
// 	success: boolean;
// 	data?: any;
// 	error?: string;
// }

export const postCreateGoalList = async (formData: FormData): Promise<ApiResponse<any>> => {
	const res = await POST('goal-lists/create', {body: formData, file: true, auth: true});

	return res;
};
