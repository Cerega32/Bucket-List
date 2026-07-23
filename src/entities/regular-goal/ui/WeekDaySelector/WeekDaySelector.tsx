import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';

import '@/entities/regular-goal/ui/WeekDaySelector/week-day-selector.scss';

export interface WeekDaySchedule {
	monday: boolean;
	tuesday: boolean;
	wednesday: boolean;
	thursday: boolean;
	friday: boolean;
	saturday: boolean;
	sunday: boolean;
}

interface WeekDaySelectorProps {
	className?: string;
	schedule: WeekDaySchedule;
	onChange: (schedule: WeekDaySchedule) => void;
	minSelected?: number;
}

export const WeekDaySelector: FC<WeekDaySelectorProps> = (props) => {
	const {className, schedule, onChange, minSelected = 1} = props;
	const [block, element] = useBem('week-day-selector', className);

	const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
	const dayKeys: (keyof WeekDaySchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
	const selectedCount = dayKeys.filter((dayKey) => schedule[dayKey]).length;

	const handleDayClick = (dayKey: keyof WeekDaySchedule) => {
		if (schedule[dayKey] && selectedCount <= minSelected) {
			return;
		}

		const newSchedule = {
			...schedule,
			[dayKey]: !schedule[dayKey],
		};
		onChange(newSchedule);
	};

	const handleDayKeyDown = (e: React.KeyboardEvent, dayKey: keyof WeekDaySchedule) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleDayClick(dayKey);
		}
	};

	return (
		<div className={block()}>
			{dayKeys.map((dayKey, index) => {
				const isSelected = schedule[dayKey];
				const isBlocked = !isSelected;
				const isLocked = isSelected && selectedCount <= minSelected;

				return (
					<div key={dayKey} className={element('day-wrapper')}>
						<div
							className={element('day', {
								selected: isSelected,
								blocked: isBlocked,
								locked: isLocked,
							})}
							onClick={() => handleDayClick(dayKey)}
							onKeyDown={(e) => handleDayKeyDown(e, dayKey)}
							role="button"
							tabIndex={0}
							aria-label={
								isLocked
									? `${dayNames[index]}: минимум один день должен остаться выбранным`
									: `${isSelected ? 'Отменить выбор' : 'Выбрать'} ${dayNames[index]}`
							}
						>
							{isBlocked ? (
								<Svg icon="cross" className={element('day-icon')} />
							) : (
								<Svg icon="done" className={element('day-icon-selected')} />
							)}
						</div>
						<span className={element('day-name', {selected: isSelected})}>{dayNames[index]}</span>
					</div>
				);
			})}
		</div>
	);
};
