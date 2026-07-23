import {IShortGoal} from '@/entities/goal/model/types';
import {GET} from '@/shared/api/http/requests';

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
