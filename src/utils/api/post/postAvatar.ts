import {POST} from '@/utils/fetch/requests';

export const postAvatar = async (avatar) => {
	const response = await POST('users/avatar/upload', {body: avatar, auth: true, file: true});
	return response;
};
