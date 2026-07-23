import {DELETE} from '@/shared/api/http/requests';

export const deleteAvatar = async () => {
	const response = await DELETE('users/avatar/delete', {auth: true});
	return response;
};
