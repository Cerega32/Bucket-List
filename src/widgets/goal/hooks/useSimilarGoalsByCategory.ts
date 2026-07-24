import {useCallback, useEffect, useState} from 'react';

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

	const loadSimilarGoals = useCallback(async () => {
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
	}, [code, enabled, limit]);

	useEffect(() => {
		loadSimilarGoals();
	}, [loadSimilarGoals]);

	/** Тихая перезагрузка без скелетона — после других действий на странице. */
	const reloadSimilarGoals = useCallback(async () => {
		if (!enabled || !code) {
			setGoals([]);
			return;
		}

		try {
			const response = await getSimilarGoalsByCategory(code, limit);
			if (response.success && response.data?.results) {
				setGoals(dedupeGoalsById(response.data.results));
			} else {
				setGoals([]);
			}
		} catch {
			// оставляем текущий список при ошибке
		}
	}, [code, enabled, limit]);

	/** Убрать цель и подставить другую из API (после удаления/выполнения). */
	const replaceSimilarGoalByCode = useCallback(
		async (goalCode: string) => {
			if (!code) {
				setGoals((prev) => prev.filter((goal) => goal.code !== goalCode));
				return;
			}

			let excludeIds: number[] = [];
			setGoals((prev) => {
				excludeIds = prev.map((goal) => goal.id);
				return prev.filter((goal) => goal.code !== goalCode);
			});

			try {
				const response = await getSimilarGoalsByCategory(code, limit + excludeIds.length + 4);
				const candidates =
					response.success && response.data?.results ? response.data.results.filter((goal) => !excludeIds.includes(goal.id)) : [];
				const replacement = candidates[0];
				if (replacement) {
					setGoals((prev) => dedupeGoalsById([...prev, replacement]).slice(0, limit));
				}
			} catch {
				// слот просто остаётся пустым
			}
		},
		[code, limit]
	);

	return {
		similarGoals: goals,
		setSimilarGoals: setGoals,
		isLoading,
		reloadSimilarGoals,
		replaceSimilarGoalByCode,
	};
};
