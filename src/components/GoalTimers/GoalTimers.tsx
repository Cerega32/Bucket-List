import {format} from 'date-fns';
import {ru} from 'date-fns/locale/ru';
import {FC, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Loader} from '@/components/Loader/Loader';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {getUserTimers, TimerInfo} from '@/utils/api/get/getGoalTimer';

import './goal-timers.scss';

// Расширенный интерфейс для таймера с дополнительными полями
interface ITimer extends TimerInfo {
	id?: number;
	goal: {
		code: string;
		title: string;
		image?: string; // Добавляем поле image, которого нет в базовом интерфейсе
	};
}

// Компонент для отображения отдельного таймера
interface GoalTimerItemProps {
	timer: ITimer;
}

const GoalTimerItem: FC<GoalTimerItemProps> = ({timer}) => {
	const [block, element] = useBem('goal-timer-item');
	const navigate = useNavigate();

	const deadline = new Date(timer.deadline);
	const formattedDate = format(deadline, 'd MMMM yyyy', {locale: ru});

	const goToGoal = () => {
		navigate(`/goals/${timer.goal.code}`);
	};

	return (
		<div className={block({expired: timer.isExpired})}>
			{timer.goal?.image && (
				<div className={element('image-container')}>
					<img src={timer.goal.image} alt={timer.goal.title} className={element('image')} />
				</div>
			)}
			<div className={element('content')}>
				<h3 className={element('title')}>{timer.goal.title}</h3>
				<div className={element('timer-info')}>
					<div className={element('deadline')}>
						<span className={element('label')}>Дедлайн: </span>
						{formattedDate}
					</div>

					{timer.isExpired ? (
						<div className={element('expired')}>Время истекло</div>
					) : (
						<div>
							<span className={element('label')}>Осталось: </span>
							{timer.daysLeft} {timer.daysLeft === 1 ? 'день' : timer.daysLeft < 5 ? 'дня' : 'дней'}
						</div>
					)}
				</div>
				<Button theme="blue-light" onClick={goToGoal} className={element('button')}>
					Перейти к цели
				</Button>
			</div>
		</div>
	);
};

// Основной компонент списка таймеров
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

	const toggleShowExpired = () => {
		setShowExpired((prev) => !prev);
	};

	return (
		<div className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Мои таймеры
				</Title>
				<Button theme="blue-light" onClick={toggleShowExpired} className={element('toggle-button')} size="medium" width="auto">
					{showExpired ? 'Скрыть истекшие' : 'Показать истекшие'}
				</Button>
			</div>

			{loading ? (
				<div className={element('loading')}>
					<Loader isLoading={loading} />
				</div>
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
