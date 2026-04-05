import {GET} from '@/utils/fetch/requests';

export const getListGoalsPage = async (code: string, page: number, pageSize = 30) => {
	const response = await GET(`goal-lists/${code}`, {auth: true, get: {page, page_size: pageSize}});
	return response;
};
