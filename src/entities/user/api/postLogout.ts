import {POST} from '@/shared/api/http/requests';

/** Logout — сервер удалит httpOnly token-cookie и маркер is_authenticated.
 * JS сам убрать token не может (httpOnly), поэтому этот запрос обязателен. */
export const postLogout = async () => {
	return POST('logout', {auth: true, showErrorNotification: false});
};
