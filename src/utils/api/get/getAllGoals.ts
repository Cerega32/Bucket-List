import {GET, IRequestGet} from '@/utils/fetch/requests';

export const getAllGoals = async (category: string, get?: IRequestGet) => {
	const response = await GET(`goals/${category}/all`, {
		auth: true,
		get,
	});
	return response;
};
