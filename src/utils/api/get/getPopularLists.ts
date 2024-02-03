import {GET} from '@/utils/fetch/requests';

export const getPopularLists = async (category: string) => {
	const response = await GET(`goal-lists/${category}/popular`, {auth: true});
	return response;
};
