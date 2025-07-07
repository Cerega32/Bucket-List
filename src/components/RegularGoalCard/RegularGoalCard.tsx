import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IGoal, IRegularGoalStatistics} from '@/typings/goal';
import {markRegularProgress} from '@/utils/api/goals';

import {Button} from '../Button/Button';
import {Progress} from '../Progress/Progress';
import {Svg} from '../Svg/Svg';

import './regular-goal-card.scss';

interface RegularGoalCardProps {
	goal: IGoal;
	statistics: IRegularGoalStatistics;
	onProgressUpdate?: () => void;
	className?: string;
}

export const RegularGoalCard: FC<RegularGoalCardProps> = ({goal, statistics, onProgressUpdate, className}) => {
	const [block, element] = useBem('regular-goal-card', className);

	const handleMarkCompleted = async () => {
		if (!goal.regularConfig || !statistics.canCompleteToday) return;

		try {
			const response = await markRegularProgress({
				regular_goal_id: goal.regularConfig.id,
				completed: true,
				notes: '',
			});

			if (response.success && response.data && onProgressUpdate) {
				onProgressUpdate();
			}
		} catch (error) {
			console.error('Ошибка отметки прогресса:', error);
		}
	};

	const getFrequencyText = () => {
		if (!goal.regularConfig) return '';

		switch (goal.regularConfig.frequency) {
			case 'daily':
				return 'Ежедневно';
			case 'weekly':
				return `${goal.regularConfig.weeklyFrequency} раз в неделю`;
			case 'custom':
				return 'Пользовательский график';
			default:
				return '';
		}
	};

	const getCurrentProgress = () => {
		if (!statistics.currentPeriodProgress) return null;

		const progress = statistics.currentPeriodProgress;

		if (progress.type === 'daily') {
			return {
				completed: progress.completedToday || false,
				text: progress.completedToday ? 'Выполнено сегодня' : 'Не выполнено сегодня',
				streak: progress.streak || 0,
			};
		}

		if (progress.type === 'weekly') {
			return {
				completed: (progress.currentWeekCompletions || 0) >= (progress.requiredPerWeek || 1),
				text: `${progress.currentWeekCompletions || 0} из ${progress.requiredPerWeek || 1} на этой неделе`,
				progress: progress.weekProgress || 0,
			};
		}

		return null;
	};

	const currentProgress = getCurrentProgress();

	return (
		<div className={block()}>
			<div className={element('header')}>
				<img src={goal.image} alt={goal.title} className={element('image')} />
				<div className={element('info')}>
					<h3 className={element('title')}>{goal.title}</h3>
					<p className={element('frequency')}>{getFrequencyText()}</p>
					<div className={element('category')}>{goal.category.name}</div>
				</div>
			</div>

			<div className={element('progress-section')}>
				{currentProgress && (
					<div className={element('current-progress')}>
						{currentProgress.progress !== undefined ? (
							<>
								<div className={element('progress-header')}>
									<span className={element('progress-text')}>{currentProgress.text}</span>
									<span className={element('progress-percent')}>{Math.round(currentProgress.progress)}%</span>
								</div>
								<Progress done={currentProgress.progress} all={100} goal />
							</>
						) : (
							<div className={element('daily-status', {completed: currentProgress.completed})}>
								<Svg icon={currentProgress.completed ? 'done' : 'clock'} className={element('status-icon')} />
								<span>{currentProgress.text}</span>
								{currentProgress.streak > 0 && <span className={element('streak')}>Серия: {currentProgress.streak}</span>}
							</div>
						)}
					</div>
				)}

				<div className={element('stats')}>
					<div className={element('stat')}>
						<span className={element('stat-value')}>{statistics.totalCompletions}</span>
						<span className={element('stat-label')}>Выполнений</span>
					</div>
					<div className={element('stat')}>
						<span className={element('stat-value')}>{statistics.currentStreak}</span>
						<span className={element('stat-label')}>Текущая серия</span>
					</div>
					<div className={element('stat')}>
						<span className={element('stat-value')}>{Math.round(statistics.completionPercentage)}%</span>
						<span className={element('stat-label')}>Общий прогресс</span>
					</div>
				</div>
			</div>

			<div className={element('actions')}>
				{statistics.canCompleteToday && (
					<Button theme="green" onClick={handleMarkCompleted} icon="plus" className={element('mark-button')}>
						Отметить сегодня
					</Button>
				)}
				<Button type="Link" theme="blue-light" href={`/goals/${goal.code}`} className={element('view-button')}>
					Подробнее
				</Button>
			</div>
		</div>
	);
};
