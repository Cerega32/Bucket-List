import {IRegularGoalStatistics} from '@/typings/goal';

export const extractRegularGoalStatistics = (responseData: unknown): IRegularGoalStatistics | undefined => {
	if (!responseData || typeof responseData !== 'object') {
		return undefined;
	}

	const data = responseData as IRegularGoalStatistics & {
		data?: IRegularGoalStatistics | {statistics?: IRegularGoalStatistics};
		statistics?: IRegularGoalStatistics;
	};

	if (typeof data.regularGoal === 'number') {
		return data;
	}

	const nested = data.data;
	if (nested && typeof nested === 'object') {
		if ('statistics' in nested && nested.statistics) {
			return nested.statistics;
		}
		if (typeof (nested as IRegularGoalStatistics).regularGoal === 'number') {
			return nested as IRegularGoalStatistics;
		}
	}

	if (data.statistics) {
		return data.statistics;
	}

	return undefined;
};

/** Цель отмечена выполненной на сегодня (daily — явная отметка, weekly/custom — нельзя выполнить сегодня). */
export const isRegularGoalCompletedToday = (stats: IRegularGoalStatistics): boolean => {
	const progress = stats.currentPeriodProgress;
	if (progress?.type === 'daily') {
		return !!progress.completedToday;
	}
	return !stats.isInterrupted && !stats.canCompleteToday;
};

/** Цель ещё «ждёт» действия на табе «Сегодня» (не выполнена / прервана). */
export const isRegularGoalPendingForToday = (stats: IRegularGoalStatistics): boolean =>
	stats.isInterrupted || !isRegularGoalCompletedToday(stats);

/** Показывать в табе «Сегодня» и в dropdown шапки. */
export const isRegularGoalShownInTodayViews = (stats: IRegularGoalStatistics): boolean =>
	stats.isInterrupted || stats.canCompleteToday || isRegularGoalCompletedToday(stats);

/** Активные (не на паузе) выше целей с isExecutionEnabled === false. */
export const compareRegularGoalsActiveFirst = (a: IRegularGoalStatistics, b: IRegularGoalStatistics): number => {
	const aPaused = a.isExecutionEnabled === false ? 1 : 0;
	const bPaused = b.isExecutionEnabled === false ? 1 : 0;
	return aPaused - bPaused;
};

/** Счётчики для бейджа регулярных целей в шапке (только исполняемые цели). */
export const computeRegularGoalsHeaderStats = (
	statistics: IRegularGoalStatistics[],
	selectionPending = false,
	slotsLocked = false,
	isPremium = false
): {totalCount: number; completedTodayCount: number; needsAttention: boolean} => {
	const enabled = statistics.filter((stats) => stats.isActive && stats.isExecutionEnabled !== false);
	const todayViewGoals = enabled.filter((stats) => isRegularGoalShownInTodayViews(stats));
	const completedToday = todayViewGoals.filter(
		(stats) => !stats.isInterrupted && (stats.currentPeriodProgress?.completedToday === true || stats.canCompleteToday === false)
	);
	const hasPausedGoals = statistics.some((stats) => stats.isActive && stats.isExecutionEnabled === false);
	const canStillChangeSlots = !isPremium && hasPausedGoals && !slotsLocked && !selectionPending;

	return {
		totalCount: todayViewGoals.length,
		completedTodayCount: completedToday.length,
		needsAttention: (!isPremium && selectionPending) || canStillChangeSlots,
	};
};
