import {POST} from '@/shared/api/http/requests';

export const postAvatar = async (avatar: FormData) => {
	const response = await POST('users/avatar/upload', {body: avatar, auth: true, file: true});
	return response;
};
