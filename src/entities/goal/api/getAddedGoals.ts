import {UserStore} from '@/entities/user/model/UserStore';
import {GET} from '@/shared/api/http/requests';

export const getAddedGoals = async () => {
	const response = await GET('self/added-goals', {auth: true});

	if (response.success) {
		UserStore.setAddedGoals(response.data);
	}
};
