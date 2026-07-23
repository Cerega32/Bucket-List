import {UserStore} from '@/entities/user/model/UserStore';
import {GET} from '@/shared/api/http/requests';

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
