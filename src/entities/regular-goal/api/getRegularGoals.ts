import {GET, IRequestGet} from '@/shared/api/http/requests';

export const getRegularGoals = async (category: string, get?: IRequestGet) => {
	const response = await GET(`goals/${category}/all`, {
		auth: true,
		get: {...get, goal_type: 'regular'},
	});
	return response;
};
