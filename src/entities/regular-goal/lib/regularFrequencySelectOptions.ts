import {OptionSelect} from '@/shared/ui/Select/Select';

export type RegularFrequency = 'daily' | 'weekly' | 'custom';

export const REGULAR_FREQUENCY_VALUES: RegularFrequency[] = ['daily', 'weekly', 'custom'];

export const CUSTOM_SCHEDULE_PREMIUM_BADGE = 'Доступно с Premium';
export const CUSTOM_SCHEDULE_PREMIUM_BADGE_HREF = '/premium';

export const getRegularFrequencySelectOptions = (isPremium: boolean): OptionSelect[] => [
	{name: 'Ежедневно', value: 'daily'},
	{name: 'N раз в неделю', value: 'weekly'},
	{
		name: 'Пользовательский график',
		value: 'custom',
		...(!isPremium ? {disabled: true, badge: CUSTOM_SCHEDULE_PREMIUM_BADGE, badgeHref: CUSTOM_SCHEDULE_PREMIUM_BADGE_HREF} : {}),
	},
];

export const getRegularFrequencyActiveOption = (frequency: RegularFrequency): number => REGULAR_FREQUENCY_VALUES.indexOf(frequency);

export const handleRegularFrequencySelect = (index: number, isPremium: boolean, setFrequency: (value: RegularFrequency) => void): void => {
	const frequency = REGULAR_FREQUENCY_VALUES[index];
	if (frequency === 'custom' && !isPremium) {
		return;
	}
	setFrequency(frequency);
};

export const canEditCustomSchedule = (isPremium: boolean): boolean => isPremium;
