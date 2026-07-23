import {IUserInfo} from '@/entities/user/model/types';
import {PUT} from '@/shared/api/http/requests';

export const putUserInfo = async (userInfo: Partial<IUserInfo>) => {
	const response = await PUT('users/update-profile', {body: userInfo, auth: true});
	return response;
};
