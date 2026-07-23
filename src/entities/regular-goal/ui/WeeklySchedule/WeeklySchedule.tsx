import {FC, useEffect, useState} from 'react';

import {IWeeklyProgressItem} from '@/entities/user/model/types';
import {getMonthShortName} from '@/shared/lib/date/getDate';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import '@/entities/regular-goal/ui/WeeklySchedule/weekly-schedule.scss';

interface WeeklyScheduleProps {
	className?: string;
	weeks: Array<IWeeklyProgressItem>;
}

export const WeeklySchedule: FC<WeeklyScheduleProps> = (props) => {
	const {className, weeks} = props;

	const [block, element] = useBem('weekly-schedule', className);
	const [max, setMax] = useState(0);

	useEffect(() => {
		let newMax = 0;
		weeks.forEach(({completedGoals}) => {
			if (completedGoals > newMax) {
				newMax = completedGoals;
			}
		});
		setMax(newMax);
	}, [weeks]);

	return (
		<section className={block()}>
			<h3 className={element('info-title')}>Выполнено целей по неделям</h3>
			<span className={element('info-count')}>
				<Svg icon="rocket" />
				{weeks[weeks.length - 1].completedGoals}
			</span>
			<div className={element('weeks')}>
				{weeks.map((week) => (
					<div className={element('week')} key={week.weekNumber}>
						<div className={element('column')}>
							<div className={element('column-active')} style={{height: `${(week.completedGoals / max) * 100}%`}} />
						</div>
						{/* <p className={element('count')}>{week.completedGoals}</p> */}
						<p className={element('count-week')}>{`${week.weekNumber}н`}</p>
						<p className={element('month')}>{getMonthShortName(week.startDate)}</p>
					</div>
				))}
			</div>
		</section>
	);
};
