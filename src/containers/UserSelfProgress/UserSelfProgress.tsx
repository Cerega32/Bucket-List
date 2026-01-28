import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Loader} from '@/components/Loader/Loader';
import {Progress} from '@/components/Progress/Progress';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {getGoalsInProgress, IGoalProgress, updateGoalProgress} from '@/utils/api/goals';

import './user-self-progress.scss';

export const UserSelfProgress: FC = observer(() => {
	const [block, element] = useBem('user-self-progress');
	const [goals, setGoals] = useState<IGoalProgress[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const {setIsOpen, setWindow, setModalProps} = ModalStore;

	const loadGoalsInProgress = async () => {
		setIsLoading(true);
		try {
			const response = await getGoalsInProgress();
			if (response.success && response.data) {
				// Фильтруем цели с прогрессом < 100% - все цели в процессе выполнения
				// Если цель есть в базе прогресса, значит она начата
				setGoals(response.data);
			}
		} catch (error) {
			console.error('Ошибка загрузки целей в процессе:', error);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		loadGoalsInProgress();
	}, []);

	const openProgressModal = (goal: IGoalProgress) => {
		setWindow('progress-update');
		setIsOpen(true);
		setModalProps({
			goalId: goal.goal,
			goalTitle: goal.goalTitle,
			currentProgress: goal,
			onProgressUpdate: (updatedProgress: IGoalProgress) => {
				// Если цель завершена (100%), удаляем её из списка
				if (updatedProgress.progressPercentage >= 100) {
					setGoals(goals.filter((g) => g.id !== updatedProgress.id));
				} else {
					// Иначе обновляем данные цели
					setGoals(goals.map((g) => (g.id === updatedProgress.id ? updatedProgress : g)));
				}
			},
			onGoalCompleted: () => {
				// Удаляем цель из списка при завершении
				setGoals(goals.filter((g) => g.id !== goal.id));
			},
		});
	};

	const markGoalCompleted = async (goal: IGoalProgress) => {
		try {
			// Сначала обновляем прогресс до 100%
			const updateResponse = await updateGoalProgress(goal.goal, {
				progress_percentage: 100,
				daily_notes: goal.dailyNotes || '',
				is_working_today: true,
			});

			if (updateResponse.success) {
				// Удаляем цель из списка в процессе выполнения
				setGoals(goals.filter((g) => g.id !== goal.id));
				// Прогресс заданий обновляется автоматически на бэкенде
			}
		} catch (error) {
			console.error('Ошибка отметки цели как выполненной:', error);
		}
	};

	const getProgressColor = (percentage: number) => {
		if (percentage === 0) return 'var(--color-primary)';
		if (percentage < 25) return 'var(--color-red-1)';
		if (percentage < 50) return 'var(--color-orange)';
		if (percentage < 75) return 'var(--color-yellow)';
		return 'var(--color-green-1)';
	};

	const getProgressStatus = (percentage: number) => {
		if (percentage === 0) return 'Начали выполнение';
		if (percentage < 25) return 'Только начали';
		if (percentage < 50) return 'В процессе';
		if (percentage < 75) return 'Хороший прогресс';
		return 'Почти готово';
	};

	if (isLoading) {
		return <Loader isLoading />;
	}

	return (
		<section className={block()}>
			<div className={element('content')}>
				<div className={element('header')}>
					<Title tag="h2" className={element('title')}>
						Прогресс целей
					</Title>
				</div>

				{goals.length === 0 ? (
					<EmptyState title="Нет целей в процессе" description="Начните выполнение целей, чтобы отслеживать прогресс здесь">
						<Button theme="blue" type="Link" href="/user/self/active-goals">
							Перейти к активным целям
						</Button>
					</EmptyState>
				) : (
					<div className={element('goals')}>
						{goals.map((goal) => (
							<div key={goal.id} className={element('goal-card')}>
								<div className={element('goal-header')}>
									{goal.goalImage && <img src={goal.goalImage} alt={goal.goalTitle} className={element('goal-image')} />}
									<div className={element('goal-info')}>
										<h3 className={element('goal-title')}>
											<Link to={`/goals/${goal.goalCode}`} className={element('goal-link')}>
												{goal.goalTitle}
											</Link>
										</h3>
										<span className={element('goal-category')}>
											{goal.goalCategory} ({goal.goalCategoryNameEn})
										</span>
									</div>
								</div>

								<div className={element('progress-section')}>
									<div className={element('progress-header')}>
										<span className={element('progress-label')}>{getProgressStatus(goal.progressPercentage)}</span>
										<span
											className={element('progress-value')}
											style={{color: getProgressColor(goal.progressPercentage)}}
										>
											{goal.progressPercentage}%
										</span>
									</div>
									<button
										type="button"
										className={element('progress-wrapper')}
										onClick={() => openProgressModal(goal)}
										style={
											{
												cursor: 'pointer',
												border: 'none',
												background: 'transparent',
												padding: 0,
												width: '100%',
												'--progress-color': getProgressColor(goal.progressPercentage),
											} as React.CSSProperties
										}
										aria-label="Изменить прогресс"
									>
										<Progress done={goal.progressPercentage} all={100} goal className={element('progress-bar')} />
									</button>
								</div>

								{goal.dailyNotes && (
									<div className={element('notes')}>
										<p className={element('notes-text')}>{goal.dailyNotes}</p>
									</div>
								)}

								<div className={element('goal-meta')}>
									<span className={element('last-updated')}>
										Обновлено: {new Date(goal.lastUpdated).toLocaleDateString('ru-RU')}
									</span>
									{goal.isWorkingToday && <span className={element('working-badge')}>Работаю сегодня</span>}
								</div>

								<div className={element('goal-actions')}>
									<Button theme="blue-light" onClick={() => openProgressModal(goal)} icon="trending-up" size="small">
										Изменить прогресс
									</Button>
									<Button theme="green" onClick={() => markGoalCompleted(goal)} icon="check" size="small">
										Отметить выполненной
									</Button>
								</div>

								{goal.recentEntries && goal.recentEntries.length > 0 && (
									<div className={element('recent-activity')}>
										<h4 className={element('activity-title')}>Последние изменения</h4>
										<div className={element('activity-list')}>
											{goal.recentEntries.map((entry) => (
												<div key={entry.id} className={element('activity-item')}>
													<span className={element('activity-date')}>
														{new Date(entry.date).toLocaleDateString('ru-RU')}
													</span>
													<span
														className={element('activity-change', {
															positive: entry.percentageChange > 0,
															negative: entry.percentageChange < 0,
														})}
													>
														{entry.percentageChange > 0 ? '+' : ''}
														{entry.percentageChange}%
													</span>
													{entry.notes && <span className={element('activity-notes')}>{entry.notes}</span>}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
});
