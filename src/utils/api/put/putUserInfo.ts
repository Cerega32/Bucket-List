import {POST, PUT} from '@/utils/fetch/requests';

export const putUserInfo = async (userInfo) => {
	const response = await PUT('users/update-profile', {body: userInfo, auth: true});
	return response;
};
