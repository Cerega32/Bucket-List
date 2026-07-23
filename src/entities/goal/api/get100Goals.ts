import {GET} from '@/shared/api/http/requests';

export const get100Goals = async (user_id?: string) => {
	const response = await GET('100-goals', {
		auth: true,
		get: {user_id},
	});
	return response;
};
