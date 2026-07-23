import {UserStore} from '@/entities/user/model/UserStore';
import {GET} from '@/shared/api/http/requests';

export const getAddedLists = async () => {
	const response = await GET('self/added-lists', {auth: true});

	if (response.success) {
		UserStore.setAddedLists(response.data);
	}
};
