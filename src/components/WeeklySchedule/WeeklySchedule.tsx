import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import './weekly-schedule.scss';
import {Svg} from '../Svg/Svg';

interface IWeeks {
	week: number;
	month: string;
	count: number;
}

interface WeeklyScheduleProps {
	className?: string;
	weeks: Array<IWeeks>;
}

export const WeeklySchedule: FC<WeeklyScheduleProps> = (props) => {
	const {className, weeks} = props;

	const [block, element] = useBem('weekly-schedule', className);
	const [max, setMax] = useState(0);

	useEffect(() => {
		let newMax = 0;
		weeks.forEach(({count}) => {
			if (count > newMax) {
				newMax = count;
			}
		});
		setMax(newMax);
	}, [weeks]);

	return (
		<section className={block()}>
			<h3 className={element('info-title')}>Выполнено целей за неделю</h3>
			<span className={element('info-count')}>
				<Svg icon="rocket" />
				{weeks[weeks.length - 1].count}
			</span>
			<div className={element('weeks')}>
				{weeks.map((week) => (
					<div className={element('week')}>
						<div className={element('column')}>
							<div className={element('column-active')} style={{height: `${(week.count / max) * 100}%`}} />
						</div>
						<p className={element('count')}>{week.count}</p>
						<p className={element('count-week')}>{week.week}</p>
						<p className={element('month')}>{week.month}</p>
					</div>
				))}
			</div>
		</section>
	);
};
