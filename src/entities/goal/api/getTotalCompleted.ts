import {GET} from '@/shared/api/http/requests';

export const getTotalCompleted = async () => {
	const response = await GET('goals/total-completed');

	return response;
};
