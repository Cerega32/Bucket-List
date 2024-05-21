import {DELETE} from '@/utils/fetch/requests';

export const deleteAvatar = async () => {
	const response = await DELETE('users/avatar/delete', {auth: true});
	return response;
};
