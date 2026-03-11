import {GET, IRequestGet} from '@/utils/fetch/requests';

export const getUsualGoals = async (category: string, get?: IRequestGet) => {
	const response = await GET(`goals/${category}/all`, {
		auth: true,
		get: {...get, goal_type: 'usual'},
	});
	return response;
};
