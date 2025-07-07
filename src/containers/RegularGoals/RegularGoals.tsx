import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Loader} from '@/components/Loader/Loader';
import {RegularGoalCard} from '@/components/RegularGoalCard/RegularGoalCard';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {IRegularGoalStatistics, getRegularGoalStatistics} from '@/utils/api/goals';

import './regular-goals.scss';

interface RegularGoalsProps {
	className?: string;
}

export const RegularGoals: FC<RegularGoalsProps> = ({className}) => {
	const [block, element] = useBem('regular-goals');
	const [statistics, setStatistics] = useState<IRegularGoalStatistics[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Загрузка статистики регулярных целей
	const loadStatistics = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await getRegularGoalStatistics();

			if (response.success && response.data) {
				setStatistics(response.data);
			} else {
				throw new Error(response.error || 'Не удалось загрузить статистику');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
			setError(errorMessage);
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка загрузки',
				message: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadStatistics();
	}, []);

	// Обработчик обновления прогресса
	const handleProgressUpdated = (updatedStatistics: IRegularGoalStatistics) => {
		setStatistics((prev) => prev.map((stat) => (stat.id === updatedStatistics.id ? updatedStatistics : stat)));
	};

	// Фильтрация целей
	const activeGoals = statistics.filter((stat) => stat.isActive && !stat.isPaused);
	const pausedGoals = statistics.filter((stat) => stat.isActive && stat.isPaused);
	const completedGoals = statistics.filter((stat) => !stat.isActive);

	const renderGoalsList = (goals: IRegularGoalStatistics[], title: string, emptyMessage: string) => {
		if (goals.length === 0) {
			return (
				<div className={element('empty-section')}>
					<p className={element('empty-message')}>{emptyMessage}</p>
				</div>
			);
		}

		return (
			<div className={element('goals-section')}>
				<h3 className={element('section-title')}>{title}</h3>
				<div className={element('goals-list')}>
					{goals.map((stat) => (
						<RegularGoalCard
							key={stat.id}
							statistics={stat}
							onProgressUpdated={handleProgressUpdated}
							className={element('goal-card')}
						/>
					))}
				</div>
			</div>
		);
	};

	if (isLoading) {
		return (
			<div className={`${block()} ${className || ''}`}>
				<Loader isLoading>
					<div className={element('loader-placeholder')}>Загрузка регулярных целей...</div>
				</Loader>
			</div>
		);
	}

	if (error) {
		return (
			<div className={`${block()} ${className || ''}`}>
				<div className={element('error-state')}>
					<Title tag="h2" className={element('error-title')}>
						Ошибка загрузки
					</Title>
					<p className={element('error-message')}>{error}</p>
					<Button theme="blue" onClick={loadStatistics} className={element('retry-button')}>
						Попробовать снова
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className={`${block()} ${className || ''}`}>
			<div className={element('header')}>
				<Title tag="h1" className={element('title')}>
					Регулярные цели
				</Title>
				<Button theme="blue" size="small" href="/goals/create" className={element('add-button')}>
					Создать цель
				</Button>
			</div>

			{statistics.length === 0 ? (
				<div className={element('empty-state')}>
					<div className={element('empty-content')}>
						<h3 className={element('empty-title')}>У вас пока нет регулярных целей</h3>
						<p className={element('empty-description')}>
							Создайте регулярные цели для формирования полезных привычек и отслеживания ежедневного прогресса
						</p>
						<Button theme="blue" href="/goals/create" className={element('empty-button')}>
							Создать первую регулярную цель
						</Button>
					</div>
				</div>
			) : (
				<div className={element('content')}>
					{/* Активные цели */}
					{renderGoalsList(activeGoals, `Активные цели (${activeGoals.length})`, 'Нет активных регулярных целей')}

					{/* Приостановленные цели */}
					{pausedGoals.length > 0 &&
						renderGoalsList(pausedGoals, `Приостановленные цели (${pausedGoals.length})`, 'Нет приостановленных целей')}

					{/* Завершенные цели */}
					{completedGoals.length > 0 &&
						renderGoalsList(completedGoals, `Завершенные цели (${completedGoals.length})`, 'Нет завершенных целей')}

					{/* Статистика */}
					<div className={element('statistics')}>
						<div className={element('stats-grid')}>
							<div className={element('stat-item')}>
								<div className={element('stat-value')}>{activeGoals.length}</div>
								<div className={element('stat-label')}>Активных целей</div>
							</div>
							<div className={element('stat-item')}>
								<div className={element('stat-value')}>
									{activeGoals.reduce((sum, stat) => sum + stat.currentStreak, 0)}
								</div>
								<div className={element('stat-label')}>Общая серия дней</div>
							</div>
							<div className={element('stat-item')}>
								<div className={element('stat-value')}>
									{Math.round(
										activeGoals.length > 0
											? activeGoals.reduce((sum, stat) => sum + stat.completionPercentage, 0) / activeGoals.length
											: 0
									)}
									%
								</div>
								<div className={element('stat-label')}>Средний прогресс</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
