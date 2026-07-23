import {POST} from '@/shared/api/http/requests';

export const postCover = async (cover: FormData) => {
	const response = await POST('users/cover/upload', {body: cover, auth: true, file: true});
	return response;
};
