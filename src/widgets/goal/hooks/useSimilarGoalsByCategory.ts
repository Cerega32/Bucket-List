import {useEffect, useState} from 'react';

import {getSimilarGoalsByCategory} from '@/entities/goal/api/getSimilarGoalsByCategory';
import {IShortGoal} from '@/entities/goal/model/types';

const dedupeGoalsById = (goals: IShortGoal[]): IShortGoal[] => {
	const seen = new Set<number>();
	return goals.filter((goal) => {
		if (seen.has(goal.id)) {
			return false;
		}
		seen.add(goal.id);
		return true;
	});
};

export const useSimilarGoalsByCategory = (code?: string | null, enabled = true, limit = 8) => {
	const [goals, setGoals] = useState<IShortGoal[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const loadSimilarGoals = async () => {
			if (!enabled || !code) {
				setGoals([]);
				return;
			}

			setIsLoading(true);
			try {
				const response = await getSimilarGoalsByCategory(code, limit);
				if (response.success && response.data?.results) {
					setGoals(dedupeGoalsById(response.data.results));
				} else {
					setGoals([]);
				}
			} catch {
				setGoals([]);
			} finally {
				setIsLoading(false);
			}
		};

		loadSimilarGoals();
	}, [code, enabled, limit]);

	return {
		similarGoals: goals,
		isLoading,
	};
};
