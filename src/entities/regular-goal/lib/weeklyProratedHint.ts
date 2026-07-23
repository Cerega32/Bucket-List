/**
 * Пропорция weekly как на бэкенде: D ≥ N×(T/7) ⇔ 7×D ≥ N×T,
 * T — дней от первого выполнения в этой ISO-неделе до воскресенья (вкл.), 1…7.
 */

export function startOfISOWeek(d: Date): Date {
	const x = new Date(d);
	const mondayIndex = (d.getDay() + 6) % 7;
	x.setDate(d.getDate() - mondayIndex);
	x.setHours(0, 0, 0, 0);
	return x;
}

export function addDays(d: Date, days: number): Date {
	const x = new Date(d);
	x.setDate(x.getDate() + days);
	x.setHours(0, 0, 0, 0);
	return x;
}

/** Воскресенье той же ISO-недели, что и monday */
export function endOfISOWeekFromMonday(weekMonday: Date): Date {
	return addDays(weekMonday, 6);
}

export function weeklyProratedTInWeek(weekMonday: Date, weekSunday: Date, firstCompletionInWeek: Date): number {
	const monT = weekMonday.getTime();
	const sunT = weekSunday.getTime();
	let eff = new Date(weekMonday);
	const first = new Date(firstCompletionInWeek);
	first.setHours(0, 0, 0, 0);
	const f = first.getTime();
	if (f >= monT && f <= sunT) {
		eff = first;
	}
	const t = Math.round((weekSunday.getTime() - eff.getTime()) / 86400000) + 1;
	return Math.max(1, Math.min(7, t));
}

export function weeklyMinCompletions(weeklyN: number, tDays: number): number {
	if (weeklyN <= 0) return 0;
	return Math.ceil((weeklyN * tDays) / 7);
}

/** Подсказка «если начать в firstDay»: T и минимум отметок на этой неделе */
export function weeklyProratedHintForFirstDayOnCalendar(
	weeklyN: number,
	firstDay: Date,
	refToday: Date = new Date()
): {tDays: number; minCompletions: number} {
	const today = new Date(refToday);
	today.setHours(0, 0, 0, 0);
	const start = new Date(firstDay);
	start.setHours(0, 0, 0, 0);
	const mon = startOfISOWeek(today);
	const sun = endOfISOWeekFromMonday(mon);
	const tDays = weeklyProratedTInWeek(mon, sun, start);
	return {tDays, minCompletions: weeklyMinCompletions(weeklyN, tDays)};
}
