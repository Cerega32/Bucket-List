import {POST} from '@/shared/api/http/requests';
import {INotification} from '@/shared/model/NotificationStore';

export const markGoal = async (code: string, done: boolean, success?: INotification) => {
	const response = await POST(`goals/${code}/mark`, {
		auth: true,
		body: {done},
		success,
	});
	return response;
};
