import {OptionSelect} from '@/shared/ui/Select/Select';

export const ACTIVITY_MIN_CALENDAR_YEAR = 2025;

export type ActivityPeriodMode = 'rolling' | 'calendar';

export interface ActivityPeriodSelection {
	mode: ActivityPeriodMode;
	calendarYear?: number;
}

export const getAvailableCalendarYears = (referenceDate = new Date()): number[] => {
	const currentYear = referenceDate.getFullYear();
	const years: number[] = [];

	for (let year = ACTIVITY_MIN_CALENDAR_YEAR; year < currentYear; year += 1) {
		years.push(year);
	}

	return years;
};

export const buildActivityPeriodSelectOptions = (isPremium: boolean, referenceDate = new Date()): OptionSelect[] => {
	const currentYear = referenceDate.getFullYear();
	const options: OptionSelect[] = [
		{
			name: String(currentYear),
			value: 'rolling',
		},
	];

	getAvailableCalendarYears(referenceDate).forEach((year) => {
		options.push({
			name: String(year),
			value: String(year),
			...(!isPremium ? {disabled: true, badge: 'Premium', badgeHref: '/premium'} : {}),
		});
	});

	return options;
};

export const getActivityPeriodActiveOption = (selection: ActivityPeriodSelection, options: OptionSelect[]): number => {
	if (selection.mode === 'rolling') {
		return 0;
	}

	const index = options.findIndex((option) => option.value === String(selection.calendarYear));
	return index >= 0 ? index : 0;
};

export const parseActivityPeriodSelectIndex = (index: number, options: OptionSelect[]): ActivityPeriodSelection | null => {
	const option = options[index];
	if (!option || option.disabled) {
		return null;
	}

	if (option.value === 'rolling') {
		return {mode: 'rolling'};
	}

	const year = parseInt(option.value, 10);
	if (Number.isNaN(year)) {
		return null;
	}

	return {mode: 'calendar', calendarYear: year};
};
