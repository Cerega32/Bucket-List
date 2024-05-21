import {POST} from '@/utils/fetch/requests';

export const postCover = async (cover) => {
	const response = await POST('users/cover/upload', {body: cover, auth: true, file: true});
	return response;
};
