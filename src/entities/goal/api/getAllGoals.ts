import {GET, IRequestGet} from '@/shared/api/http/requests';

export const getAllGoals = async (category: string, get?: IRequestGet) => {
	const response = await GET(`goals/${category}/all`, {
		auth: true,
		get,
	});
	return response;
};
