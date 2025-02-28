import {POST} from '@/utils/fetch/requests';

export const postCover = async (cover: FormData) => {
	const response = await POST('users/cover/upload', {body: cover, auth: true, file: true});
	return response;
};
