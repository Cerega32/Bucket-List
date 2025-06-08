import {IGoal} from '@/typings/goal';
import {GET} from '@/utils/fetch/requests';

import {withRetry} from '../apiRetry';

interface GetSimilarGoalsResponse {
	success: boolean;
	data?: {results: IGoal[]};
	error?: string;
}

export const getSimilarGoals = async (query: string): Promise<GetSimilarGoalsResponse> => {
	return withRetry(
		async () => {
			return GET('goals/search-similar', {
				get: {
					query,
				},
				showErrorNotification: false, // Отключаем автоматические уведомления об ошибках для retry
			});
		},
		6,
		1
	); // Максимум 2 повтора, базовая задержка 1 секунда
};
