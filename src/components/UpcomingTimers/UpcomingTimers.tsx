import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {ITimer} from '@/typings/dashboard';
import {formatDistanceToNow} from '@/utils/date/formatDistanceToNow';

import {Button} from '../Button/Button';
import {Svg} from '../Svg/Svg';
import {Tag} from '../Tag/Tag';
import {Title} from '../Title/Title';

import './upcoming-timers.scss';

interface UpcomingTimersProps {
	className?: string;
	timers: ITimer[];
	onMarkComplete: (code: string, done: boolean) => Promise<void>;
}

export const UpcomingTimers: FC<UpcomingTimersProps> = ({className, timers, onMarkComplete}) => {
	const [block, element] = useBem('upcoming-timers', className);

	const handleMarkComplete = (code: string, done: boolean, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onMarkComplete(code, done);
	};

	return (
		<div className={block()}>
			{timers.map((timer) => {
				const isUrgent = timer.daysLeft <= 1;

				return (
					<Link key={timer.goal.code} to={`/goals/${timer.goal.code}`} className={element('timer-card', {urgent: isUrgent})}>
						<div className={element('timer-header')}>
							<Tag
								text={timer.goal.complexity === 'easy' ? 'Легко' : timer.goal.complexity === 'medium' ? 'Средне' : 'Сложно'}
								theme={timer.goal.complexity === 'easy' ? 'green' : timer.goal.complexity === 'medium' ? 'yellow' : 'red'}
							/>
							<div className={element('deadline', {urgent: isUrgent})}>
								<Svg icon="clock" width="16px" height="16px" />
								<span>{formatDistanceToNow(new Date(timer.deadline))}</span>
							</div>
						</div>

						<Title tag="h3" className={element('title')}>
							{timer.goal.title}
						</Title>

						<div className={element('progress')}>
							<div
								className={element('progress-bar', {urgent: isUrgent})}
								style={{width: `${Math.max(0, Math.min(100, ((7 - timer.daysLeft) / 7) * 100))}%`}}
							/>
						</div>

						<div className={element('footer')}>
							<span className={element('days-left', {urgent: isUrgent})}>
								{timer.daysLeft === 0 ? 'Срок сегодня!' : `Осталось: ${timer.daysLeft} дн.`}
							</span>
							<Button
								icon="done"
								theme={timer.goal.completedByUser ? 'green' : 'blue'}
								size="small"
								onClick={(e) => handleMarkComplete(timer.goal.code, timer.goal.completedByUser, e)}
							>
								{timer.goal.completedByUser ? 'Выполнено' : 'Выполнить'}
							</Button>
						</div>
					</Link>
				);
			})}
		</div>
	);
};
