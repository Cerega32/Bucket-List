import {IGoalProgress} from '@/entities/goal/api/goals';
import {IRegularGoalConfig, IRegularGoalStatistics} from '@/entities/goal/model/types';
import {WeekDaySchedule} from '@/entities/regular-goal/ui/WeekDaySelector/WeekDaySelector';
import {pluralize} from '@/shared/lib/text/pluralize';

/** Черновик для модалки до первого сохранения на сервер (id === 0) */
export function buildDraftGoalProgress(p: {goalId: number; title: string; code: string; image?: string | null}): IGoalProgress {
	return {
		id: 0,
		goal: p.goalId,
		goalTitle: p.title,
		goalCategory: '',
		goalCategoryNameEn: '',
		goalImage: p.image || '',
		goalCode: p.code,
		progressPercentage: 0,
		dailyNotes: '',
		isWorkingToday: false,
		lastUpdated: '',
		createdAt: '',
		recentEntries: [],
	};
}

/** Календарная дата YYYY-MM-DD в локальном часовом поясе (toISOString даёт UTC и ломает сопоставление с датами с бэкенда). */
export function formatLocalDateYMD(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** Форматирование выбранных дней недели ("Пн, Ср, Пт") */
export const formatDaysOfWeek = (customSchedule: WeekDaySchedule): string => {
	const dayNames: Record<keyof WeekDaySchedule, string> = {
		monday: 'Пн',
		tuesday: 'Вт',
		wednesday: 'Ср',
		thursday: 'Чт',
		friday: 'Пт',
		saturday: 'Сб',
		sunday: 'Вс',
	};

	const dayOrder: Array<keyof WeekDaySchedule> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
	const selectedDays: string[] = [];

	dayOrder.forEach((day) => {
		if (customSchedule[day] === true) {
			selectedDays.push(dayNames[day]);
		}
	});

	return selectedDays.join(', ') || '';
};

/** Текущий день недели (0 - понедельник, 1 - вторник, ..., 6 - воскресенье) */
export const getCurrentDayOfWeek = (): number => {
	const today = new Date();
	const day = today.getDay();
	return day === 0 ? 6 : day - 1;
};

/** Название дня недели по индексу (0 - понедельник, ..., 6 - воскресенье) */
export const getDayName = (index: number): string => {
	const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
	return names[index];
};

/** Хелперы для блока прогресса (цели с прогрессом, не регулярные) */
export const getLocalMonday = (d: Date): Date => {
	const t = new Date(d);
	t.setHours(0, 0, 0, 0);
	const day = t.getDay();
	const diffFromMonday = day === 0 ? 6 : day - 1;
	t.setDate(t.getDate() - diffFromMonday);
	return t;
};

/** Недели по календарю (Пн–Вс): первая неделя = 1, с каждым новым понедельником +1 от недели старта */
export const getProgressWeeksCount = (p: IGoalProgress): number => {
	if (typeof p.calendarWeeksCount === 'number') {
		return p.calendarWeeksCount;
	}
	const msPerWeek = 7 * 24 * 60 * 60 * 1000;
	const startMonday = getLocalMonday(new Date(p.createdAt));
	const todayMonday = getLocalMonday(new Date());
	const deltaWeeks = Math.floor((todayMonday.getTime() - startMonday.getTime()) / msPerWeek);
	if (deltaWeeks < 0) {
		return 1;
	}
	return Math.max(1, deltaWeeks + 1);
};

export const getProgressMaxStreak = (p: IGoalProgress): number => {
	if (typeof p.maxConsecutiveWorkDays === 'number') {
		return p.maxConsecutiveWorkDays;
	}
	const entries = (p.recentEntries || []).filter((e) => e.workDone);
	if (entries.length === 0) return 0;
	const dates = [...new Set(entries.map((e) => e.date.split('T')[0]))].sort();
	let maxStreak = 1;
	let currentStreak = 1;
	for (let i = 1; i < dates.length; i++) {
		const prev = new Date(dates[i - 1]);
		const curr = new Date(dates[i]);
		const diffDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
		if (diffDays === 1) {
			currentStreak += 1;
			maxStreak = Math.max(maxStreak, currentStreak);
		} else {
			currentStreak = 1;
		}
	}
	return maxStreak;
};

export const getProgressWeekDaysCompleted = (p: IGoalProgress): boolean[] => {
	if (p.weekWorkDone && p.weekWorkDone.length === 7) {
		return p.weekWorkDone;
	}
	const today = new Date();
	const dayOfWeek = today.getDay();
	const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	const monday = new Date(today);
	monday.setDate(today.getDate() - diff);
	monday.setHours(0, 0, 0, 0);
	const hasWorkedOnDate = (dateStr: string): boolean =>
		(p.recentEntries || []).some((e) => {
			const entryDay = e.date.split('T')[0];
			return entryDay === dateStr && (e.workDone ?? false);
		});
	return Array.from({length: 7}, (_, i) => {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		const dateStr = formatLocalDateYMD(d);
		return hasWorkedOnDate(dateStr);
	});
};

/** Количество дней с отметкой «работал» (по workDone в записях) */
export const getProgressMarkedDaysCount = (p: IGoalProgress): number => {
	if (typeof p.workedDaysCount === 'number') {
		return p.workedDaysCount;
	}
	const byDate = new Map<string, boolean>();
	(p.recentEntries || []).forEach((e) => {
		const key = e.date.split('T')[0];
		if (!key) return;
		const wd = e.workDone ?? false;
		byDate.set(key, (byDate.get(key) ?? false) || wd);
	});
	return [...byDate.values()].filter(Boolean).length;
};

export interface IRegularProgressInfo {
	text: string;
	completed?: boolean;
	streak?: number;
	progress?: number;
}

/** Текущий прогресс регулярной цели (текст + флаг/процент выполнения) на основе статистики или базовой конфигурации */
export const calcRegularProgress = (
	regularConfig: IRegularGoalConfig | undefined,
	localStatistics: IRegularGoalStatistics | null,
	isRegularGoalCompletedToday: boolean
): IRegularProgressInfo | null => {
	if (!regularConfig) return null;

	const statsCurrent = localStatistics || regularConfig.statistics;

	if (statsCurrent?.currentPeriodProgress) {
		const regularProgressData = statsCurrent.currentPeriodProgress;

		if (regularProgressData.type === 'daily') {
			const completedToday = localStatistics
				? regularProgressData.completedToday || false
				: isRegularGoalCompletedToday || regularProgressData.completedToday || false;
			return {
				text: completedToday ? 'Выполнено сегодня' : 'Не выполнено сегодня',
				completed: completedToday,
				streak: statsCurrent.currentStreak || 0,
			};
		}

		if (regularProgressData.type === 'weekly') {
			return {
				text: `${regularProgressData.currentWeekCompletions || 0} из ${regularProgressData.requiredPerWeek || 1} на этой неделе`,
				progress: regularProgressData.weekProgress || 0,
			};
		}
	}

	if (regularConfig.frequency === 'daily') {
		const completedToday = localStatistics
			? localStatistics.currentPeriodProgress?.completedToday || false
			: isRegularGoalCompletedToday;
		return {
			text: completedToday ? 'Выполнено сегодня' : 'Не выполнено сегодня',
			completed: completedToday,
			streak: statsCurrent?.currentStreak || 0,
		};
	}

	if (regularConfig.frequency === 'weekly') {
		return {
			text: `${statsCurrent?.currentWeekCompletions || 0} из ${regularConfig.weeklyFrequency || 1} на этой неделе`,
			progress: 0,
		};
	}

	if (regularConfig.frequency === 'custom' && statsCurrent?.currentPeriodProgress) {
		const regularProgressData = statsCurrent.currentPeriodProgress;
		if (regularProgressData.type === 'weekly') {
			return {
				text: `${regularProgressData.currentWeekCompletions || 0} из ${regularProgressData.requiredPerWeek || 1} на этой неделе`,
				progress: regularProgressData.weekProgress || 0,
			};
		}
	}

	if (regularConfig.frequency === 'custom') {
		return {
			text: '0 на этой неделе',
			progress: 0,
		};
	}

	return null;
};

/** "Заблокировано сегодня" — для custom-расписания, когда сегодняшний день не входит в разрешённые */
export const calcIsRegularGoalBlockedTodayBySchedule = (
	regularConfig: IRegularGoalConfig | undefined,
	isAdded: boolean,
	localStatistics: IRegularGoalStatistics | null
): boolean => {
	if (!regularConfig || !isAdded) return false;
	if (regularConfig.frequency !== 'custom') return false;

	const stats = localStatistics || regularConfig.statistics;
	const weekDays = stats?.currentPeriodProgress?.weekDays;
	if (!Array.isArray(weekDays) || weekDays.length === 0) return false;

	const todayIndex = (new Date().getDay() + 6) % 7;
	const todayData = weekDays.find((d: any) => d?.dayIndex === todayIndex);

	return todayData?.isAllowed === false;
};

/** Форматирование длительности регулярной цели для отображения в карточке */
export const calcDurationDisplay = (
	regularConfig: IRegularGoalConfig | undefined,
	localStatistics: IRegularGoalStatistics | null,
	isAdded: boolean
): string => {
	if (!regularConfig) return '';

	const stats = localStatistics || regularConfig.statistics;
	const source = isAdded && stats?.regularGoalData ? stats.regularGoalData : regularConfig;
	const durationType = source.durationType || regularConfig.durationType;
	const durationValue = source.durationValue ?? regularConfig.durationValue;
	const endDate = source.endDate ?? regularConfig.endDate;

	switch (durationType) {
		case 'days':
			return `${pluralize(durationValue || 0, ['день', 'дня', 'дней'])}`;
		case 'weeks':
			return `${pluralize(durationValue || 0, ['неделя', 'недели', 'недель'])}`;
		case 'until_date':
			if (endDate) {
				const date = new Date(endDate);
				return date.toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric'});
			}
			return 'До даты';
		case 'indefinite':
			return 'Бессрочно';
		default:
			return '';
	}
};

/** Форматирование периодичности регулярной цели для отображения в карточке */
export const calcFrequencyDisplay = (
	regularConfig: IRegularGoalConfig | undefined,
	localStatistics: IRegularGoalStatistics | null,
	isAdded: boolean
): string => {
	if (!regularConfig) return '';

	let {frequency, customSchedule, weeklyFrequency} = regularConfig;

	const stats = localStatistics || regularConfig.statistics;

	if (isAdded && stats?.regularGoalData) {
		frequency = stats.regularGoalData.frequency || frequency;
		customSchedule = stats.regularGoalData.customSchedule || customSchedule;
		weeklyFrequency = stats.regularGoalData.weeklyFrequency || weeklyFrequency;
	}

	if (frequency === 'daily') {
		return 'Ежедневно';
	}

	if (frequency === 'weekly') {
		if (customSchedule && Object.keys(customSchedule).length > 0) {
			return formatDaysOfWeek(customSchedule);
		}
		return pluralize(weeklyFrequency || 0, ['раз в неделю', 'раза в неделю', 'раз в неделю']);
	}

	if (frequency === 'custom' && customSchedule) {
		return formatDaysOfWeek(customSchedule);
	}

	return '';
};

export interface ISeriesInfo {
	value: number;
	unit: string;
	isInterrupted: boolean;
	isCompleted: boolean;
	maxStreak: number;
	maxStreakUnit: string;
}

/** Информация о текущей серии регулярной цели (значение + единица измерения — дни или недели) */
export const calcSeriesInfo = (
	localStatistics: IRegularGoalStatistics | null,
	regularConfig: IRegularGoalConfig | undefined
): ISeriesInfo => {
	const stats = localStatistics || regularConfig?.statistics;

	const frequency = stats?.regularGoalData?.frequency || regularConfig?.frequency;
	const isWeeklyUnit = frequency !== 'daily';

	if (!stats || !regularConfig) {
		const unit = isWeeklyUnit ? pluralize(0, ['неделя', 'недели', 'недель']) : pluralize(0, ['день', 'дня', 'дней']);
		return {value: 0, unit, isInterrupted: false, isCompleted: false, maxStreak: 0, maxStreakUnit: unit};
	}

	const seriesIsCompleted = stats.isSeriesCompleted || false;
	const isInterrupted = stats.isInterrupted || false;

	let streak = stats.currentStreak || 0;
	if (isInterrupted && stats.interruptedStreak !== null && stats.interruptedStreak !== undefined) {
		streak = stats.interruptedStreak;
	} else if (seriesIsCompleted) {
		if (isWeeklyUnit) {
			// weekly/custom → недели. Считаем календарные недели от старта серии до её завершения,
			// чтобы короткие серии показывали минимум 1 неделю, а серия, завершившаяся на 2-й неделе — 2.
			const startStr = stats.startDate;
			const endStr = stats.seriesCompletionDate;
			if (startStr && endStr) {
				const startMonday = getLocalMonday(new Date(startStr));
				const endMonday = getLocalMonday(new Date(endStr));
				const msPerWeek = 7 * 24 * 60 * 60 * 1000;
				const deltaWeeks = Math.floor((endMonday.getTime() - startMonday.getTime()) / msPerWeek);
				streak = Math.max(1, deltaWeeks + 1);
			} else {
				streak = Math.max(1, stats.completedWeeks || stats.currentStreak || 0);
			}
		} else {
			streak = stats.totalCompletions > 0 ? stats.totalCompletions : stats.currentStreak || 0;
		}
	} else {
		const completions = stats.totalCompletions ?? 0;
		if (completions === 0) {
			streak = 0;
		} else if (isWeeklyUnit) {
			streak = stats.completedWeeks > 0 ? stats.completedWeeks : stats.currentStreak || 0;
		} else {
			streak = stats.currentStreak || 0;
		}
	}

	const maxStreakValue = stats.maxStreak || 0;

	if (isWeeklyUnit) {
		return {
			value: streak,
			unit: pluralize(streak, ['неделя', 'недели', 'недель']),
			isInterrupted,
			isCompleted: seriesIsCompleted,
			maxStreak: maxStreakValue,
			maxStreakUnit: pluralize(maxStreakValue, ['неделя', 'недели', 'недель']),
		};
	}
	return {
		value: streak,
		unit: pluralize(streak, ['день', 'дня', 'дней']),
		isInterrupted,
		isCompleted: seriesIsCompleted,
		maxStreak: maxStreakValue,
		maxStreakUnit: pluralize(maxStreakValue, ['день', 'дня', 'дней']),
	};
};

/** Глубокая копия статистики регулярной цели с сервера, чтобы React увидел изменение вложенных объектов */
export const cloneRegularStatistics = (statisticsData: IRegularGoalStatistics): IRegularGoalStatistics => {
	const newStatistics = {...statisticsData};

	if (newStatistics.currentPeriodProgress) {
		const currentPeriodProgress = {...newStatistics.currentPeriodProgress};
		if (currentPeriodProgress.weekDays && Array.isArray(currentPeriodProgress.weekDays)) {
			currentPeriodProgress.weekDays = currentPeriodProgress.weekDays.map((day) => ({...day}));
		}
		newStatistics.currentPeriodProgress = currentPeriodProgress;
	}

	if (newStatistics.regularGoalData) {
		newStatistics.regularGoalData = {...newStatistics.regularGoalData};
	}

	return newStatistics;
};

export interface IDeriveRegularGoalCompletedTodayOptions {
	/** Учитывать ли canCompleteToday для weekly/custom (иначе используется только currentPeriodProgress daily) */
	checkWeeklyOrCustom?: boolean;
	/** Значение, если ни одно из условий не сработало */
	fallback?: boolean;
}

/** Выполнена ли регулярная цель сегодня/на этой неделе, на основе свежей статистики после действия пользователя */
export const deriveRegularGoalCompletedToday = (
	statistics: IRegularGoalStatistics,
	regularConfig: IRegularGoalConfig,
	options?: IDeriveRegularGoalCompletedTodayOptions
): boolean => {
	const {checkWeeklyOrCustom = true, fallback = false} = options || {};

	if (statistics.currentPeriodProgress?.type === 'daily') {
		return statistics.currentPeriodProgress.completedToday || false;
	}

	if (checkWeeklyOrCustom && (regularConfig.frequency === 'custom' || regularConfig.frequency === 'weekly')) {
		return !statistics.canCompleteToday;
	}

	return fallback;
};

/** Процент прогресса регулярной цели (null для бессрочных целей) */
export const calcProgressPercentage = (
	regularConfig: IRegularGoalConfig | undefined,
	localStatistics: IRegularGoalStatistics | null,
	regularProgress: IRegularProgressInfo | null
): number | null => {
	if (!regularConfig || !regularProgress) return null;

	const stats = localStatistics || regularConfig.statistics;
	const durationType = stats?.regularGoalData?.durationType || regularConfig.durationType;

	if (stats?.isInterrupted && stats.interruptedCompletionPercentage !== null && stats.interruptedCompletionPercentage !== undefined) {
		return stats.interruptedCompletionPercentage;
	}

	if (durationType === 'indefinite') {
		return null;
	}

	if (stats?.completionPercentage !== undefined && stats.completionPercentage !== null) {
		return stats.completionPercentage;
	}

	if (regularConfig.frequency === 'daily') {
		return regularProgress.completed ? 100 : 0;
	}

	if (regularConfig.frequency === 'weekly' && regularProgress.progress !== undefined) {
		return regularProgress.progress;
	}

	if (regularConfig.frequency === 'custom') {
		if (regularProgress?.progress !== undefined) {
			return regularProgress.progress;
		}
		return null;
	}

	return null;
};
