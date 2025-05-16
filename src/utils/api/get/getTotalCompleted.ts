import {GET} from '@/utils/fetch/requests';

export const getTotalCompleted = async () => {
	const response = await GET('goals/total-completed');

	return response;
};
