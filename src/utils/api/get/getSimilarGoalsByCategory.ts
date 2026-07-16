import {IShortGoal} from '@/typings/goal';
import {GET} from '@/utils/fetch/requests';

interface GetSimilarGoalsByCategoryResponse {
	success: boolean;
	data?: {results: IShortGoal[]};
	error?: string;
}

export const getSimilarGoalsByCategory = async (code: string, limit = 8): Promise<GetSimilarGoalsByCategoryResponse> => {
	return GET(`goals/${code}/similar`, {
		get: {
			limit,
		},
	});
};
