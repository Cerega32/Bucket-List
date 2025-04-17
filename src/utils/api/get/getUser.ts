import {UserStore} from '@/store/UserStore';
import {GET} from '@/utils/fetch/requests';

export const getUser = async (id?: string) => {
	const response = await GET(`user${id ? `/${id}` : ''}`, {auth: true});

	if (response.success) {
		if (id) {
			UserStore.setUserInfo(response.data);
		} else {
			UserStore.setUserSelf(response.data);
		}
	}
};
