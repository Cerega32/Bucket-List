import {UserStore} from '@/store/UserStore';
import {GET} from '@/utils/fetch/requests';

export const getUser = async () => {
	const response = await GET('self', {auth: true});

	if (response.success) {
		UserStore.setUserInfo(response.data);
	}
};
