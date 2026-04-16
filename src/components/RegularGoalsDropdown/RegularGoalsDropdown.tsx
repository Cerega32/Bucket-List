import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {HeaderProgressGoalsStore} from '@/store/HeaderProgressGoalsStore';
import {HeaderRegularGoalsStore} from '@/store/HeaderRegularGoalsStore';
import {ModalStore} from '@/store/ModalStore';
import {IRegularGoalStatistics} from '@/typings/goal';
import {
	getGoalsInProgress,
	getRegularGoalStatistics,
	IGoalProgress,
	markRegularProgress,
	restartRegularGoal,
	updateGoalProgress,
} from '@/utils/api/goals';

import {ProgressGoalCompactCard} from './ProgressGoalCompactCard';
import {RegularGoalCompactCard} from './RegularGoalCompactCard';
import {RegularGoalsDropdownSkeleton} from './RegularGoalsDropdownSkeleton';
import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';
import {BlurLoader} from '../Loader/BlurLoader';
import './regular-goals-dropdown.scss';

interface RegularGoalsDropdownProps {
	isOpen: boolean;
	onClose: () => void;
	variant?: 'regular' | 'progress';
}

export const RegularGoalsDropdown: FC<RegularGoalsDropdownProps> = observer(({isOpen, onClose, variant = 'regular'}) => {
	const [block, element] = useBem('regular-goals-dropdown');
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [regularGoals, setRegularGoals] = useState<IRegularGoalStatistics[]>([]);
	const [progressGoals, setProgressGoals] = useState<IGoalProgress[]>([]);
	const [loading, setLoading] = useState(true);
	const isProgress = variant === 'progress';

	// Загрузка данных
	useEffect(() => {
		const load = async () => {
			if (!isOpen) return;

			setLoading(true);
			try {
				if (isProgress) {
					const response = await getGoalsInProgress();
					if (response.success && response.data) {
						const raw = response.data as
							| IGoalProgress[]
							| {
									data: IGoalProgress[];
							  };
						const list = Array.isArray(raw) ? raw : raw.data;
						setProgressGoals(list || []);
					}
				} else {
					const response = await getRegularGoalStatistics({page_size: 100});
					if (response.success && response.data) {
						const statistics = Array.isArray(response.data) ? response.data : response.data.data;
						const active = statistics
							.filter((stat) => stat.isActive)
							.sort((a, b) => {
								// Прерванные — в конец
								if (a.isInterrupted !== b.isInterrupted) return a.isInterrupted ? 1 : -1;
								// Выполненные сегодня — после невыполненных
								const aDone = a.currentPeriodProgress?.completedToday === true;
								const bDone = b.currentPeriodProgress?.completedToday === true;
								if (aDone === bDone) return 0;
								return aDone ? 1 : -1;
							});
						setRegularGoals(active);
						const completedCount = active.filter(
							(s) => !s.isInterrupted && (s.currentPeriodProgress?.completedToday === true || s.canCompleteToday === false)
						).length;
						HeaderRegularGoalsStore.setStats(active.length, completedCount);
					}
				}
			} catch (error) {
				console.error(isProgress ? 'Ошибка загрузки целей в процессе' : 'Ошибка загрузки регулярных целей:', error);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [isOpen, isProgress]);

	// Закрываем при клике вне компонента
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleProgressMarkToday = async (goal: IGoalProgress) => {
		try {
			const response = await updateGoalProgress(goal.goal, {
				progress_percentage: goal.progressPercentage,
				daily_notes: goal.dailyNotes || '',
				is_working_today: !goal.isWorkingToday,
			});
			if (response.success && response.data) {
				setProgressGoals((prev) => prev.map((g) => (g.id === goal.id ? response.data! : g)));
				HeaderProgressGoalsStore.loadGoalsInProgress();
			}
		} catch (error) {
			console.error('Ошибка отметки «работаю сегодня»:', error);
		}
	};

	const handleProgressChange = (goal: IGoalProgress) => {
		ModalStore.setWindow('progress-update');
		ModalStore.setIsOpen(true);
		ModalStore.setModalProps({
			goalId: goal.goal,
			goalTitle: goal.goalTitle,
			currentProgress: goal,
			onProgressUpdate: (updated: IGoalProgress) => {
				setProgressGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
				if (updated.progressPercentage >= 100) {
					setProgressGoals((prev) => prev.filter((g) => g.id !== updated.id));
				}
				HeaderProgressGoalsStore.loadGoalsInProgress();
			},
			onGoalCompleted: () => {
				setProgressGoals((prev) => prev.filter((g) => g.id !== goal.id));
				HeaderProgressGoalsStore.loadGoalsInProgress();
			},
		});
	};

	const refreshRegularGoals = async () => {
		const updatedResponse = await getRegularGoalStatistics({page_size: 100});
		if (updatedResponse.success && updatedResponse.data) {
			const statistics = Array.isArray(updatedResponse.data) ? updatedResponse.data : updatedResponse.data.data;
			const active = statistics
				.filter((stat) => stat.isActive)
				.sort((a, b) => {
					if (a.isInterrupted !== b.isInterrupted) return a.isInterrupted ? 1 : -1;
					const aDone = a.currentPeriodProgress?.completedToday === true;
					const bDone = b.currentPeriodProgress?.completedToday === true;
					if (aDone === bDone) return 0;
					return aDone ? 1 : -1;
				});
			setRegularGoals(active);
			const completedCount = active.filter(
				(s) => !s.isInterrupted && (s.currentPeriodProgress?.completedToday === true || s.canCompleteToday === false)
			).length;
			HeaderRegularGoalsStore.setStats(active.length, completedCount);
		}
	};

	const handleQuickComplete = async (regularGoalId: number, currentlyCompleted: boolean) => {
		setLoading(true);
		try {
			const response = await markRegularProgress({
				regular_goal_id: regularGoalId,
				completed: !currentlyCompleted,
			});

			if (response.success) {
				await refreshRegularGoals();
			}
		} catch (error) {
			console.error('Ошибка отметки регулярной цели:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleRestart = async (regularGoalId: number) => {
		setLoading(true);
		try {
			const response = await restartRegularGoal(regularGoalId);
			if (response.success) {
				await refreshRegularGoals();
			}
		} catch (error) {
			console.error('Ошибка рестарта регулярной цели:', error);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	const goals = isProgress
		? [...progressGoals].sort((a, b) => {
				const aDone = a.isWorkingToday;
				const bDone = b.isWorkingToday;
				if (aDone === bDone) return 0;
				return aDone ? 1 : -1;
		  })
		: [];
	const MAX_VISIBLE = 12;
	const regularList = regularGoals.slice(0, MAX_VISIBLE);

	return (
		<div ref={dropdownRef} className={block()}>
			<div className={element('content')}>
				{loading && (isProgress ? progressGoals.length === 0 : regularGoals.length === 0) ? (
					<RegularGoalsDropdownSkeleton variant={variant} />
				) : (
					<BlurLoader active={loading} className={element('loader')}>
						{isProgress ? (
							goals.length === 0 ? (
								<EmptyState
									title="Прогресс для целей не установлен"
									description="Задайте отслеживание прогресса выполнения в любой активной цели"
									size="small"
									className={element('empty')}
								/>
							) : (
								<div className={element('list')}>
									{goals.map((progress) => (
										<ProgressGoalCompactCard
											key={progress.id}
											progress={progress}
											onMarkToday={() => handleProgressMarkToday(progress)}
											onChangeProgress={() => handleProgressChange(progress)}
										/>
									))}
								</div>
							)
						) : regularGoals.length === 0 ? (
							<EmptyState
								title="Регулярных целей нет"
								description="Добавьте цели из каталога для отслеживания привычек"
								size="small"
								className={element('empty')}
							/>
						) : (
							<div className={element('list')}>
								{regularList.map((statistics) => (
									<RegularGoalCompactCard
										key={statistics.id}
										statistics={statistics}
										onQuickComplete={(id, completed) => handleQuickComplete(id, completed)}
										onRestart={(id) => handleRestart(id)}
									/>
								))}
							</div>
						)}
					</BlurLoader>
				)}
			</div>

			<div className={element('footer')}>
				{isProgress ? (
					<Link to="/user/self/progress" onClick={onClose}>
						<Button theme="blue-light" className={element('view-all')}>
							Перейти в прогресс целей
						</Button>
					</Link>
				) : (
					<Link to="/user/self/regular" onClick={onClose}>
						<Button theme="blue-light" className={element('view-all')}>
							Перейти в регулярные цели
						</Button>
					</Link>
				)}
			</div>
		</div>
	);
});
