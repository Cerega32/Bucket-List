import {IGoal} from '@/typings/goal';
import {GET} from '@/utils/fetch/requests';

interface GetSimilarGoalsResponse {
	success: boolean;
	data?: {results: IGoal[]};
	error?: string;
}

export const getSimilarGoals = async (query: string): Promise<GetSimilarGoalsResponse> => {
	const response = await GET('goals/search-similar', {
		get: {
			query,
		},
	});

	return response;
};
