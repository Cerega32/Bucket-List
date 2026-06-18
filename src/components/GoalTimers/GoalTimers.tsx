import {format} from 'date-fns';
import {ru} from 'date-fns/locale/ru';
import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Line} from '@/components/Line/Line';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {getUserTimers, TimerInfo} from '@/utils/api/get/getGoalTimer';
import {isPremiumSubscriptionActive} from '@/utils/regularGoal/checkRegularGoalsAddLimit';

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
	canOpenGoal: boolean;
}

function pluralDays(n: number): string {
	const abs = Math.abs(n) % 100;
	const last = abs % 10;
	if (abs > 10 && abs < 20) return 'дней';
	if (last > 1 && last < 5) return 'дня';
	if (last === 1) return 'день';
	return 'дней';
}

const GoalTimerItem: FC<GoalTimerItemProps> = ({timer, canOpenGoal}) => {
	const [block, element] = useBem('goal-timer-item');

	const deadline = new Date(timer.deadline);
	const formattedDate = format(deadline, 'd MMM yyyy', {locale: ru});

	const content = (
		<>
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
		</>
	);

	if (!canOpenGoal) {
		return (
			<div className={block({expired: timer.isExpired, locked: true})} title="Просмотр цели с истекшим сроком доступен с Premium">
				{content}
			</div>
		);
	}

	return (
		<Link to={`/goals/${timer.goal.code}`} className={block({expired: timer.isExpired})}>
			{content}
		</Link>
	);
};

const GoalTimers: FC = observer(() => {
	const [block, element] = useBem('goal-timers');
	const isPremium = isPremiumSubscriptionActive(UserStore.userSelf);
	const [timers, setTimers] = useState<ITimer[]>([]);
	const [loading, setLoading] = useState(true);
	const [showExpired, setShowExpired] = useState(false);

	const fetchTimers = useCallback(async () => {
		try {
			setLoading(true);
			const response = await getUserTimers({expiredOnly: showExpired});

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
	}, [showExpired]);

	useEffect(() => {
		fetchTimers();
	}, [fetchTimers]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				fetchTimers();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
	}, [fetchTimers]);

	const canOpenTimerGoal = (timer: ITimer) => isPremium || !timer.isExpired;

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

			{!isPremium && (
				<p className={element('premium-note')}>
					Установка и редактирование сроков — функция{' '}
					<Link to="/premium" className={element('premium-link')}>
						Premium
					</Link>
					. Ранее заданные сроки остаются в списке.
				</p>
			)}

			{loading ? (
				<GoalTimersSkeleton />
			) : timers.length > 0 ? (
				<div className={element('list')}>
					{timers.map((timer, index) => (
						<GoalTimerItem
							key={timer.id ? `timer-${timer.id}` : `timer-${timer.goal.code}-${index}`}
							timer={timer}
							canOpenGoal={canOpenTimerGoal(timer)}
						/>
					))}
				</div>
			) : showExpired ? (
				<EmptyState title="Нет истекших таймеров" description="Здесь появятся цели с просроченным сроком выполнения" />
			) : (
				<EmptyState
					title="У вас пока нет активных таймеров"
					description={
						isPremium
							? 'Установите таймер для своих целей, чтобы не пропустить дедлайн'
							: 'Активные сроки отображаются здесь. Истекшие — по кнопке «Показать истекшие». Установка новых сроков доступна с Premium.'
					}
				>
					{!isPremium && (
						<Button type="Link" href="/premium" theme="blue" size="medium" width="auto">
							Подключить Premium
						</Button>
					)}
				</EmptyState>
			)}
		</div>
	);
});

export default GoalTimers;
