import {INotification} from '@/store/NotificationStore';
import {POST} from '@/utils/fetch/requests';

export const markGoal = async (code: string, done: boolean, success?: INotification) => {
	const response = await POST(`goals/${code}/mark`, {
		auth: true,
		body: {done},
		success,
	});
	return response;
};
