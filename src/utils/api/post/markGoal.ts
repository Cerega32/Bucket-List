import {POST} from '@/utils/fetch/requests';

export const markGoal = async (code: string, done: boolean) => {
	const response = await POST(`goals/${code}/mark`, {
		auth: true,
		body: {done},
	});
	return response;
};
