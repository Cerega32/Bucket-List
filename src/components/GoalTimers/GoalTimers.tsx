import {format} from 'date-fns';
import {ru} from 'date-fns/locale/ru';
import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Line} from '@/components/Line/Line';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {getUserTimers, TimerInfo} from '@/utils/api/get/getGoalTimer';

import {GoalTimersSkeleton} from './GoalTimersSkeleton';
import './goal-timers.scss';

interface ITimer extends TimerInfo {
	id?: number;
	goal: {
		code: string;
		title: string;
		image?: string;
	};
}

interface GoalTimerItemProps {
	timer: ITimer;
}

function pluralDays(n: number): string {
	const abs = Math.abs(n) % 100;
	const last = abs % 10;
	if (abs > 10 && abs < 20) return 'дней';
	if (last > 1 && last < 5) return 'дня';
	if (last === 1) return 'день';
	return 'дней';
}

const GoalTimerItem: FC<GoalTimerItemProps> = ({timer}) => {
	const [block, element] = useBem('goal-timer-item');

	const deadline = new Date(timer.deadline);
	const formattedDate = format(deadline, 'd MMM yyyy', {locale: ru});

	return (
		<Link to={`/goals/${timer.goal.code}`} className={block({expired: timer.isExpired})}>
			<div className={element('gradient')}>
				{timer.goal.image ? (
					<img src={timer.goal.image} alt={timer.goal.title} className={element('image')} />
				) : (
					<div className={element('image-placeholder')}>
						<Svg icon="stopwatch" width="40px" height="40px" />
					</div>
				)}
			</div>
			<div className={element('info')}>
				<h3 className={element('title')}>{timer.goal.title}</h3>
				<div className={element('down-wrapper')}>
					<Line />
					<div className={element('timer-info')}>
						<span className={element('deadline')}>
							<Svg icon="calendar" width="14px" height="14px" />
							{formattedDate}
						</span>
						{timer.isExpired ? (
							<span className={element('expired-label')}>Истекло</span>
						) : (
							<span className={element('days-left', {urgent: timer.daysLeft <= 3})}>
								{timer.daysLeft} {pluralDays(timer.daysLeft)}
							</span>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
};

const GoalTimers: FC = () => {
	const [block, element] = useBem('goal-timers');
	const [timers, setTimers] = useState<ITimer[]>([]);
	const [loading, setLoading] = useState(true);
	const [showExpired, setShowExpired] = useState(false);

	useEffect(() => {
		const fetchTimers = async () => {
			try {
				setLoading(true);
				const response = await getUserTimers(showExpired);

				if (response.success && response.data) {
					setTimers(response.data);
				} else {
					NotificationStore.addNotification({
						type: 'error',
						title: 'Ошибка',
						message: 'Не удалось загрузить таймеры',
					});
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Ошибка при загрузке таймеров:', error);
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Произошла ошибка при загрузке таймеров',
				});
			} finally {
				setLoading(false);
			}
		};

		fetchTimers();
	}, [showExpired]);

	return (
		<div className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Мои таймеры
				</Title>
				<Button
					theme="blue-light"
					onClick={() => setShowExpired((prev) => !prev)}
					className={element('toggle-button')}
					size="medium"
					width="auto"
				>
					{showExpired ? 'Скрыть истекшие' : 'Показать истекшие'}
				</Button>
			</div>

			{loading ? (
				<GoalTimersSkeleton />
			) : timers.length > 0 ? (
				<div className={element('list')}>
					{timers.map((timer, index) => (
						<GoalTimerItem key={timer.id ? `timer-${timer.id}` : `timer-${timer.goal.code}-${index}`} timer={timer} />
					))}
				</div>
			) : (
				<EmptyState
					title="У вас пока нет активных таймеров"
					description="Установите таймер для своих целей, чтобы не пропустить дедлайн"
				/>
			)}
		</div>
	);
};

export default GoalTimers;
