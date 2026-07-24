import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';

import {
	getGoalsInProgress,
	getRegularGoalStatistics,
	IGoalProgress,
	markRegularProgress,
	restartRegularGoal,
	updateGoalProgress,
} from '@/entities/goal/api/goals';
import {refreshHeaderGoalCounts} from '@/entities/goal/lib/refreshHeaderGoalCounts';
import {HeaderProgressGoalsStore} from '@/entities/goal/model/HeaderProgressGoalsStore';
import {IRegularGoalStatistics} from '@/entities/goal/model/types';
import {isPremiumSubscriptionActive} from '@/entities/regular-goal/lib/checkRegularGoalsAddLimit';
import {
	computeRegularGoalsHeaderStats,
	extractRegularGoalStatistics,
	isRegularGoalShownInTodayViews,
} from '@/entities/regular-goal/lib/regularGoalTodayVisibility';
import {HeaderRegularGoalsStore} from '@/entities/regular-goal/model/HeaderRegularGoalsStore';
import {getUser} from '@/entities/user/api/getUser';
import {requireEmailConfirmed} from '@/entities/user/lib/requireEmailConfirmed';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {TODAY_TAB_HIDE_DELAY_MS} from '@/shared/lib/hooks/useTodayTabDisplayList';
import {ModalStore} from '@/shared/model/ModalStore';
import {Banner} from '@/shared/ui/Banner/Banner';
import {Button} from '@/shared/ui/Button/Button';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';
import {BlurLoader} from '@/shared/ui/Loader/BlurLoader';
import {ProgressGoalCompactCard} from '@/widgets/regular-goals-dropdown/ProgressGoalCompactCard';
import {RegularGoalCompactCard} from '@/widgets/regular-goals-dropdown/RegularGoalCompactCard';
import {RegularGoalsDropdownSkeleton} from '@/widgets/regular-goals-dropdown/RegularGoalsDropdownSkeleton';
import '@/widgets/regular-goals-dropdown/regular-goals-dropdown.scss';

interface RegularGoalsDropdownProps {
	isOpen: boolean;
	onClose: () => void;
	variant?: 'regular' | 'progress';
	disableClickOutside?: boolean;
}

const sortRegularGoalsList = (list: IRegularGoalStatistics[]): IRegularGoalStatistics[] =>
	[...list].sort((a, b) => {
		if (a.isInterrupted !== b.isInterrupted) return a.isInterrupted ? 1 : -1;
		const aDone = a.currentPeriodProgress?.completedToday === true;
		const bDone = b.currentPeriodProgress?.completedToday === true;
		if (aDone === bDone) return 0;
		return aDone ? 1 : -1;
	});

const prepareRegularGoalsForDropdown = (statistics: IRegularGoalStatistics[]): IRegularGoalStatistics[] =>
	sortRegularGoalsList(
		statistics.filter((stat) => stat.isActive && stat.isExecutionEnabled !== false && isRegularGoalShownInTodayViews(stat))
	);

const syncHeaderRegularGoalsStats = (statistics: IRegularGoalStatistics[], selectionPending: boolean) => {
	const {userSelf} = UserStore;
	const slotsLocked = userSelf.regularGoalsSlotsLocked ?? false;
	const stats = computeRegularGoalsHeaderStats(statistics, selectionPending, slotsLocked, isPremiumSubscriptionActive(userSelf));
	HeaderRegularGoalsStore.setStats(stats.totalCount, stats.completedTodayCount, stats.needsAttention);
};

export const RegularGoalsDropdown: FC<RegularGoalsDropdownProps> = observer(
	({isOpen, onClose, variant = 'regular', disableClickOutside = false}) => {
		const [block, element] = useBem('regular-goals-dropdown');
		const dropdownRef = useRef<HTMLDivElement>(null);
		const navigate = useNavigate();
		const {userSelf} = UserStore;
		const selectionPending = userSelf.regularGoalsSelectionPending ?? false;
		const [regularGoals, setRegularGoals] = useState<IRegularGoalStatistics[]>([]);
		const [progressGoals, setProgressGoals] = useState<IGoalProgress[]>([]);
		const [loading, setLoading] = useState(true);
		const isProgress = variant === 'progress';
		const canEditProgress = isPremiumSubscriptionActive(userSelf);
		const hideTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

		const scheduleDropdownGoalRemoval = (goalId: number) => {
			const existingTimeout = hideTimeoutsRef.current.get(goalId);
			if (existingTimeout) {
				clearTimeout(existingTimeout);
			}

			const timeoutId = setTimeout(() => {
				hideTimeoutsRef.current.delete(goalId);
				setRegularGoals((prev) => {
					const next = prev.filter((item) => item.regularGoal !== goalId);
					syncHeaderRegularGoalsStats(next, selectionPending);
					return next;
				});
			}, TODAY_TAB_HIDE_DELAY_MS);

			hideTimeoutsRef.current.set(goalId, timeoutId);
		};

		useEffect(() => {
			return () => {
				hideTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
				hideTimeoutsRef.current.clear();
			};
		}, []);

		// Загрузка данных
		useEffect(() => {
			const load = async () => {
				if (!isOpen) return;

				if (!isProgress) {
					await getUser();
				}

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
						const response = await getRegularGoalStatistics();
						if (response.success && response.data) {
							const statistics = Array.isArray(response.data) ? response.data : response.data.data;
							syncHeaderRegularGoalsStats(statistics, selectionPending);
							const active = prepareRegularGoalsForDropdown(statistics);
							setRegularGoals(active);
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

		// Закрываем при клике вне компонента (в шапке отключено — переключение панелей в Header)
		useEffect(() => {
			if (disableClickOutside) {
				return;
			}

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
		}, [isOpen, onClose, disableClickOutside]);

		const handleProgressMarkToday = async (goal: IGoalProgress) => {
			if (!canEditProgress) {
				return;
			}
			if (!requireEmailConfirmed()) {
				return;
			}
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
			if (!canEditProgress) {
				navigate('/premium');
				return;
			}
			if (!requireEmailConfirmed()) {
				return;
			}
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
					refreshHeaderGoalCounts();
				},
				onGoalCompleted: () => {
					setProgressGoals((prev) => prev.filter((g) => g.id !== goal.id));
					refreshHeaderGoalCounts();
				},
			});
		};

		const refreshRegularGoals = async () => {
			const updatedResponse = await getRegularGoalStatistics();
			if (updatedResponse.success && updatedResponse.data) {
				const statistics = Array.isArray(updatedResponse.data) ? updatedResponse.data : updatedResponse.data.data;
				syncHeaderRegularGoalsStats(statistics, selectionPending);
				const active = prepareRegularGoalsForDropdown(statistics);
				setRegularGoals(active);
			}
		};

		const handleQuickComplete = async (regularGoalId: number, currentlyCompleted: boolean) => {
			try {
				const response = await markRegularProgress({
					regular_goal_id: regularGoalId,
					completed: !currentlyCompleted,
				});

				if (response.success) {
					const updatedStats = response.data?.statistics;
					if (updatedStats) {
						setRegularGoals((prev) => {
							const next = sortRegularGoalsList(
								prev
									.map((item) => (item.regularGoal === regularGoalId ? updatedStats : item))
									.filter((stat) => stat.isActive && isRegularGoalShownInTodayViews(stat))
							);
							syncHeaderRegularGoalsStats(next, selectionPending);
							return next;
						});
						if (!isRegularGoalShownInTodayViews(updatedStats)) {
							scheduleDropdownGoalRemoval(regularGoalId);
						}
					} else {
						await refreshRegularGoals();
					}
					HeaderRegularGoalsStore.loadTodayCount(selectionPending);
					refreshHeaderGoalCounts();
				}
			} catch (error) {
				console.error('Ошибка отметки регулярной цели:', error);
			}
		};

		const handleRestart = async (regularGoalId: number) => {
			try {
				const response = await restartRegularGoal(regularGoalId);
				if (response.success) {
					const updatedStats = extractRegularGoalStatistics(response.data);
					if (updatedStats) {
						setRegularGoals((prev) => {
							const next = sortRegularGoalsList(
								prev.map((item) => (item.regularGoal === regularGoalId ? updatedStats : item))
							);
							syncHeaderRegularGoalsStats(next, selectionPending);
							return next;
						});
						if (!isRegularGoalShownInTodayViews(updatedStats)) {
							scheduleDropdownGoalRemoval(regularGoalId);
						}
					} else {
						await refreshRegularGoals();
					}
					HeaderRegularGoalsStore.loadTodayCount(selectionPending);
				}
			} catch (error) {
				console.error('Ошибка рестарта регулярной цели:', error);
			}
		};

		if (!isOpen) return null;

		const MAX_VISIBLE = 12;
		const goals = isProgress
			? [...progressGoals]
					.sort((a, b) => {
						const aDone = a.isWorkingToday;
						const bDone = b.isWorkingToday;
						if (aDone === bDone) return 0;
						return aDone ? 1 : -1;
					})
					.slice(0, MAX_VISIBLE)
			: [];
		const regularList = regularGoals.slice(0, MAX_VISIBLE);

		return (
			<div ref={dropdownRef} className={block()}>
				{!isProgress && selectionPending && (
					<Banner
						type="warning"
						className={element('banner')}
						message="Не все регулярные цели доступны. Выберите активные на странице регулярных целей."
						actionText="Перейти к выбору"
						onAction={() => {
							onClose();
							navigate('/user/self/regular');
						}}
					/>
				)}
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
												canEditProgress={canEditProgress}
												onMarkToday={() => handleProgressMarkToday(progress)}
												onChangeProgress={() => handleProgressChange(progress)}
												onNavigate={onClose}
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
											onNavigate={onClose}
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
	}
);
