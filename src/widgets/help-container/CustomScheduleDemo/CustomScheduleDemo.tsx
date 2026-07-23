import {FC, useMemo, useState} from 'react';

import {WeekDaySchedule, WeekDaySelector} from '@/entities/regular-goal/ui/WeekDaySelector/WeekDaySelector';
import {useBem} from '@/shared/lib/hooks/useBem';

import '@/widgets/help-container/CustomScheduleDemo/custom-schedule-demo.scss';

const DEMO_SCHEDULE: WeekDaySchedule = {
	monday: true,
	tuesday: false,
	wednesday: true,
	thursday: false,
	friday: true,
	saturday: false,
	sunday: false,
};

const DAY_LABELS: Record<keyof WeekDaySchedule, string> = {
	monday: 'Пн',
	tuesday: 'Вт',
	wednesday: 'Ср',
	thursday: 'Чт',
	friday: 'Пт',
	saturday: 'Сб',
	sunday: 'Вс',
};

export const CustomScheduleDemo: FC = () => {
	const [block, element] = useBem('custom-schedule-demo');
	const [schedule, setSchedule] = useState<WeekDaySchedule>(DEMO_SCHEDULE);

	const selectedDaysText = useMemo(() => {
		const selected = (Object.keys(DAY_LABELS) as (keyof WeekDaySchedule)[])
			.filter((day) => schedule[day])
			.map((day) => DAY_LABELS[day]);

		return selected.join(', ');
	}, [schedule]);

	return (
		<div className={block()}>
			<p className={element('caption')}>
				Нажмите на день, чтобы добавить или убрать его из графика. Минимум один день должен оставаться выбранным.
			</p>
			<WeekDaySelector schedule={schedule} onChange={setSchedule} className={element('selector')} />
			<p className={element('legend')}>
				<span className={element('legend-item', {active: true})}>галочка — день выполнения</span>
				<span className={element('legend-item', {active: false})}>крестик — выходной</span>
			</p>
			<p className={element('result')}>
				Ваш график: <strong>{selectedDaysText}</strong>
			</p>
		</div>
	);
};
