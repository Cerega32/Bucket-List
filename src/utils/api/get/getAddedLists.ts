import {UserStore} from '@/store/UserStore';
import {GET} from '@/utils/fetch/requests';

export const getAddedLists = async () => {
	const response = await GET('self/added-lists', {auth: true});

	if (response.success) {
		UserStore.setAddedLists(response.data);
	}
};
