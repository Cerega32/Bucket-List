import {UserStore} from '@/store/UserStore';
import {GET} from '@/utils/fetch/requests';

export const getAddedGoals = async () => {
	const response = await GET('self/added-goals', {auth: true});

	if (response.success) {
		UserStore.setAddedGoals(response.data);
	}
};
