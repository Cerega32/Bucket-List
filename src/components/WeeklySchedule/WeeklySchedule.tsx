import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import './weekly-schedule.scss';

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

	return <section className={block()}>
		{
			weeks.map((week) => {
				
			}
		}
	</section>;
};
