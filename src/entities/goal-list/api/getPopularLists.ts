import {GET} from '@/shared/api/http/requests';

export const getPopularLists = async (category: string) => {
	const response = await GET(`goal-lists/${category}/popular`, {auth: true});
	return response;
};
