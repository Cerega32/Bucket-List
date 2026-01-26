import {FC} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';

import './week-day-selector.scss';

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
}

export const WeekDaySelector: FC<WeekDaySelectorProps> = ({className, schedule, onChange}) => {
	const [block, element] = useBem('week-day-selector', className);

	const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
	const dayKeys: (keyof WeekDaySchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

	const handleDayClick = (dayKey: keyof WeekDaySchedule) => {
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

				return (
					<div key={dayKey} className={element('day-wrapper')}>
						<div
							className={element('day', {
								selected: isSelected,
								blocked: isBlocked,
							})}
							onClick={() => handleDayClick(dayKey)}
							onKeyDown={(e) => handleDayKeyDown(e, dayKey)}
							role="button"
							tabIndex={0}
							aria-label={`${isSelected ? 'Отменить выбор' : 'Выбрать'} ${dayNames[index]}`}
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
