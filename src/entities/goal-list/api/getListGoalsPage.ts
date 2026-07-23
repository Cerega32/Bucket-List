import {GET, IRequestGet} from '@/shared/api/http/requests';

export interface ListGoalsQueryParams extends IRequestGet {
	page?: number;
	pageSize?: number;
	search?: string;
	sort_by?: string;
	complexity?: string;
	goal_type?: string;
	completion?: string;
}

export const getListGoalsPage = async (code: string, queryParams: ListGoalsQueryParams = {}) => {
	const {page = 1, pageSize = 30, ...rest} = queryParams;
	const response = await GET(`goal-lists/${code}`, {auth: true, get: {page, page_size: pageSize, ...rest}});
	return response;
};
