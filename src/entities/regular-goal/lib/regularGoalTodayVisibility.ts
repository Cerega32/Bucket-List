import {IRegularGoalStatistics} from '@/entities/goal/model/types';

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

/** Custom-расписание: сегодняшний день не входит в разрешённые («Сегодня нельзя выполнить»). */
export const isRegularGoalBlockedBySchedule = (stats: IRegularGoalStatistics): boolean => {
	const progress = stats.currentPeriodProgress;
	if (progress?.type !== 'custom') {
		return false;
	}

	const weekDays = Array.isArray(progress.weekDays) ? progress.weekDays : null;
	if (!weekDays || weekDays.length === 0) {
		return false;
	}

	const todayIndex = (new Date().getDay() + 6) % 7;
	const todayData = weekDays.find((day) => day.dayIndex === todayIndex);
	return todayData?.isAllowed === false;
};

/**
 * Цель отмечена выполненной на сегодня.
 * daily — явная отметка; weekly/custom — canCompleteToday === false из‑за уже сделанной отметки
 * (не путать с блокировкой расписанием).
 */
export const isRegularGoalCompletedToday = (stats: IRegularGoalStatistics): boolean => {
	if (stats.isInterrupted || isRegularGoalBlockedBySchedule(stats)) {
		return false;
	}

	const progress = stats.currentPeriodProgress;
	if (progress?.type === 'daily') {
		return !!progress.completedToday;
	}

	return !stats.canCompleteToday;
};

/** Можно ли переключить отметку выполнения на сегодня (не прервана, не на паузе, не заблокирована расписанием). */
export const isRegularGoalMarkableToday = (stats: IRegularGoalStatistics): boolean =>
	!stats.isInterrupted && stats.isExecutionEnabled !== false && !isRegularGoalBlockedBySchedule(stats);

/** Цель ещё «ждёт» действия на табе «Сегодня» (не выполнена / прервана). */
export const isRegularGoalPendingForToday = (stats: IRegularGoalStatistics): boolean => {
	if (!stats.isInterrupted && isRegularGoalBlockedBySchedule(stats)) {
		return false;
	}

	return !!stats.isInterrupted || !isRegularGoalCompletedToday(stats);
};

/** Показывать в табе «Сегодня» и в dropdown шапки. */
export const isRegularGoalShownInTodayViews = (stats: IRegularGoalStatistics): boolean => {
	if (stats.isInterrupted) {
		return true;
	}

	if (isRegularGoalBlockedBySchedule(stats)) {
		return false;
	}

	return !!stats.canCompleteToday || isRegularGoalCompletedToday(stats);
};

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
	const completedToday = todayViewGoals.filter((stats) => isRegularGoalCompletedToday(stats));
	const hasPausedGoals = statistics.some((stats) => stats.isActive && stats.isExecutionEnabled === false);
	const canStillChangeSlots = !isPremium && hasPausedGoals && !slotsLocked && !selectionPending;

	return {
		totalCount: todayViewGoals.length,
		completedTodayCount: completedToday.length,
		needsAttention: (!isPremium && selectionPending) || canStillChangeSlots,
	};
};
