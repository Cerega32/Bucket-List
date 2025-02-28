import {IUserInfo} from '@/typings/user';
import {PUT} from '@/utils/fetch/requests';

export const putUserInfo = async (userInfo: Partial<IUserInfo>) => {
	const response = await PUT('users/update-profile', {body: userInfo, auth: true});
	return response;
};
