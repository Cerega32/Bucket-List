import {GET, IRequestGet} from '@/shared/api/http/requests';

export const getAllLists = async (category: string, get?: IRequestGet) => {
	const response = await GET(`goal-lists/${category}/all`, {
		auth: true,
		get,
	});
	return response;
};
