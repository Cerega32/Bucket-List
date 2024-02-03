import {UserStore} from '@/store/UserStore';
import {GET} from '@/utils/fetch/requests';

export const getUser = async (id: string) => {
	const response = await GET(`user/${id}`, {auth: true});

	if (response.success) {
		UserStore.setUserInfo(response.data);
	}
};
