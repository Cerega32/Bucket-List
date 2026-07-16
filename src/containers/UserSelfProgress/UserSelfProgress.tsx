import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {scroller} from 'react-scroll';

import {Banner} from '@/components/Banner/Banner';
import {Button} from '@/components/Button/Button';
import {RegularCard} from '@/components/Card/RegularCard';
import {CatalogItemsSkeleton} from '@/components/CatalogItems/CatalogItemsSkeleton';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {FiltersDrawer, FilterGroup} from '@/components/FiltersDrawer/FiltersDrawer';
import {Line} from '@/components/Line/Line';
import {BlurLoader} from '@/components/Loader/BlurLoader';
import {Pagination} from '@/components/Pagination/Pagination';
import Select, {OptionSelect} from '@/components/Select/Select';
import {Switch} from '@/components/Switch/Switch';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {useTodayTabDisplayList} from '@/hooks/useTodayTabDisplayList';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {IPaginationPage} from '@/typings/request';
import {getUser} from '@/utils/api/get/getUser';
import {getGoalsInProgress, IGoalProgress, updateGoalProgress} from '@/utils/api/goals';
import {DEMO_PROGRESS_GOALS} from '@/utils/goalProgress/progressDemoGoals';
import {isPremiumSubscriptionActive} from '@/utils/regularGoal/checkRegularGoalsAddLimit';

import '@/components/CatalogItems/catalog-items.scss';
import './user-self-progress.scss';

const SORT_OPTIONS: OptionSelect[] = [
	{name: 'По прогрессу (убыв.)', value: 'progress_desc'},
	{name: 'По прогрессу (возр.)', value: 'progress_asc'},
	{name: 'По названию', value: 'title_asc'},
	{name: 'По дате обновления', value: 'last_updated_desc'},
];

const buildMarkedProgressGoal = (goal: IGoalProgress, isWorkingToday: boolean): IGoalProgress => ({
	...goal,
	isWorkingToday,
});

export const UserSelfProgress: FC = observer(() => {
	const [block, element] = useBem('user-self-progress');
	const location = useLocation();
	const navigate = useNavigate();
	const activeTab = (location.hash === '#all' ? 'all' : 'today') as 'today' | 'all';
	const isPremium = isPremiumSubscriptionActive(UserStore.userSelf);
	const canEditProgress = isPremium;
	const progressGoalsCount = UserStore.userSelf.counts?.progressGoals;
	const skipProgressCountSyncRef = useRef(true);

	const [goals, setGoals] = useState<IGoalProgress[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [activeSort, setActiveSort] = useState(0);
	const [filterValues, setFilterValues] = useState<Record<string, string[]>>({categories: [], complexity: []});
	const [pagination, setPagination] = useState<IPaginationPage | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [isPageLoading, setIsPageLoading] = useState(false);
	const [todayCount, setTodayCount] = useState<number>(0);
	const [isBulkTodayUpdating, setIsBulkTodayUpdating] = useState(false);

	const mergeGoalUpdate = useCallback((updated: IGoalProgress) => {
		setGoals((prev) => {
			const index = prev.findIndex((item) => item.id === updated.id);
			if (index === -1) {
				return [...prev, updated];
			}

			const next = [...prev];
			next[index] = updated;
			return next;
		});
	}, []);

	const buildPendingTodayGoals = useCallback(() => goals.filter((goal) => !goal.isWorkingToday), [goals]);

	const {
		displayItems: todayDisplayGoals,
		todayTabCount,
		applyMarkedItem,
		applyUnmarkedItem,
		revertMarkedItem,
		markAllItems,
		unmarkAllItems,
	} = useTodayTabDisplayList({
		activeTab,
		isSourceReady: !isLoading && goals.length > 0,
		buildPendingItems: buildPendingTodayGoals,
		getItemId: (goal) => goal.id,
	});

	const categoryFilters = useMemo(() => {
		const map = new Map<string, string>();
		goals.forEach((g) => {
			if (g.goalCategory && !map.has(g.goalCategory)) map.set(g.goalCategory, g.goalCategory);
		});
		return Array.from(map.values()).map((name) => ({name, code: name}));
	}, [goals]);

	const applyFiltersAndSort = useCallback(
		(source: IGoalProgress[]) => {
			let result = [...source];

			if (search.trim()) {
				const q = search.trim().toLowerCase();
				result = result.filter((g) => g.goalTitle.toLowerCase().includes(q));
			}

			if (filterValues['categories'].length > 0) {
				result = result.filter((g) => filterValues['categories'].includes(g.goalCategory));
			}

			if (filterValues['complexity'].length > 0) {
				result = result.filter((g) => g.goalComplexity && filterValues['complexity'].includes(g.goalComplexity));
			}

			const sortKey = SORT_OPTIONS[activeSort]?.value;
			if (sortKey === 'progress_desc') {
				result.sort((a, b) => b.progressPercentage - a.progressPercentage);
			} else if (sortKey === 'progress_asc') {
				result.sort((a, b) => a.progressPercentage - b.progressPercentage);
			} else if (sortKey === 'title_asc') {
				result.sort((a, b) => a.goalTitle.localeCompare(b.goalTitle));
			} else if (sortKey === 'last_updated_desc') {
				result.sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));
			}

			return result;
		},
		[search, filterValues, activeSort]
	);

	const filteredAllGoals = useMemo(() => applyFiltersAndSort(goals), [goals, applyFiltersAndSort]);

	const handleSearchChange = (value: string) => setSearch(value);
	const handleFilterChange = (key: string, selected: string[]) => {
		setFilterValues((prev) => ({...prev, [key]: selected}));
	};
	const handleFilterReset = () => setFilterValues({categories: [], complexity: []});

	const drawerFilters = useMemo((): FilterGroup[] => {
		const groups: FilterGroup[] = [];
		if (categoryFilters.length > 0) {
			groups.push({key: 'categories', label: 'Категории', options: categoryFilters, multiple: true, allLabel: 'Все категории'});
		}
		groups.push({
			key: 'complexity',
			label: 'Сложность',
			options: [
				{name: 'Легко', code: 'easy'},
				{name: 'Средне', code: 'medium'},
				{name: 'Тяжело', code: 'hard'},
			],
			allLabel: 'Все цели',
		});
		return groups;
	}, [categoryFilters]);
	const handleSortSelect = (index: number) => setActiveSort(index);

	const {setIsOpen, setWindow, setModalProps} = ModalStore;

	const loadGoalsInProgress = async (page = 1, options?: {silent?: boolean}) => {
		if (!options?.silent) {
			setIsLoading(page === 1);
			setIsPageLoading(page > 1);
		}

		try {
			const response = await getGoalsInProgress({page});
			if (response.success && response.data) {
				const data = response.data as
					| IGoalProgress[]
					| {
							pagination: IPaginationPage;
							data: IGoalProgress[];
							todayCount?: number;
					  };

				if (Array.isArray(data)) {
					setGoals(data);
					setPagination({
						itemsPerPage: data.length,
						page: 1,
						totalPages: 1,
						totalItems: data.length,
					});
					setTodayCount(data.filter((g) => !g.isWorkingToday).length);
				} else {
					setGoals(data.data);
					setPagination(data.pagination);
					setCurrentPage(data.pagination.page);
					if (data.todayCount !== undefined) {
						setTodayCount(data.todayCount);
					} else {
						setTodayCount(data.data.filter((g) => !g.isWorkingToday).length);
					}
				}
			}
		} catch {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось загрузить цели в процессе',
			});
		} finally {
			if (!options?.silent) {
				setIsLoading(false);
				setIsPageLoading(false);
			}
		}
	};

	const refreshProgressAndProfile = async (page: number, options?: {silent?: boolean}) => {
		await loadGoalsInProgress(page, options);
		await getUser();
	};

	useEffect(() => {
		loadGoalsInProgress();
	}, []);

	useEffect(() => {
		if (skipProgressCountSyncRef.current) {
			skipProgressCountSyncRef.current = false;
			return;
		}

		loadGoalsInProgress(currentPage, {silent: goals.length > 0}).catch(() => {});
	}, [progressGoalsCount, currentPage]);

	useEffect(() => {
		if (activeTab === 'today') {
			setSearch('');
			setFilterValues({categories: [], complexity: []});
		}
	}, [activeTab]);

	const openProgressModal = (goal: IGoalProgress) => {
		if (!canEditProgress) {
			return;
		}
		const pageAtOpen = currentPage;
		setWindow('progress-update');
		setIsOpen(true);
		setModalProps({
			goalId: goal.goal,
			goalTitle: goal.goalTitle,
			currentProgress: goal,
			onProgressUpdate: async () => {
				await refreshProgressAndProfile(pageAtOpen);
			},
		});
	};

	const markToday = async (goal: IGoalProgress) => {
		if (!canEditProgress) {
			return;
		}
		const marking = !goal.isWorkingToday;

		if (marking) {
			applyMarkedItem(goal, buildMarkedProgressGoal(goal, true));
		} else {
			applyUnmarkedItem(buildMarkedProgressGoal(goal, false));
		}

		try {
			const updateResponse = await updateGoalProgress(goal.goal, {
				progress_percentage: goal.progressPercentage,
				daily_notes: goal.dailyNotes || '',
				is_working_today: marking,
			});

			if (updateResponse.success && updateResponse.data) {
				const updated = updateResponse.data;
				mergeGoalUpdate(updated);

				if (marking) {
					applyMarkedItem(goal, updated);
				} else {
					applyUnmarkedItem(updated);
				}

				refreshProgressAndProfile(currentPage, {silent: true}).catch(() => {});
			} else if (marking) {
				revertMarkedItem(goal);
			}
		} catch {
			if (marking) {
				revertMarkedItem(goal);
			}
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось обновить отметку «работаю сегодня»',
			});
		}
	};

	const markGoalCompleted = async (goal: IGoalProgress) => {
		try {
			const updateResponse = await updateGoalProgress(goal.goal, {
				progress_percentage: 100,
				daily_notes: goal.dailyNotes || '',
				is_working_today: true,
			});

			if (updateResponse.success) {
				await refreshProgressAndProfile(currentPage);
			}
		} catch {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось отметить цель как выполненную',
			});
		}
	};

	const pendingTodayOnPage = goals.filter((g) => !g.isWorkingToday);
	const markedTodayOnPage = goals.filter((g) => g.isWorkingToday);
	const allMarkedOnPage = goals.length > 0 && pendingTodayOnPage.length === 0;

	const handleToggleCompleteAllToday = async () => {
		if (!canEditProgress || activeTab !== 'today' || isBulkTodayUpdating || goals.length === 0) {
			return;
		}

		setIsBulkTodayUpdating(true);
		const markingAll = pendingTodayOnPage.length > 0;
		const targets = markingAll ? pendingTodayOnPage : markedTodayOnPage;

		if (markingAll) {
			markAllItems(targets, (goal) => buildMarkedProgressGoal(goal, true));
		} else {
			unmarkAllItems(targets);
		}

		try {
			const responses = await Promise.all(
				targets.map((goal) =>
					updateGoalProgress(goal.goal, {
						progress_percentage: goal.progressPercentage,
						daily_notes: goal.dailyNotes || '',
						is_working_today: markingAll,
					})
				)
			);

			responses.forEach((response, index) => {
				const goal = targets[index];
				if (!response.success || !response.data) {
					if (markingAll) {
						revertMarkedItem(goal);
					}
					return;
				}

				const updated = response.data;
				mergeGoalUpdate(updated);

				if (markingAll) {
					applyMarkedItem(goal, updated);
				} else {
					applyUnmarkedItem(updated);
				}
			});

			refreshProgressAndProfile(currentPage, {silent: true}).catch(() => {});
		} catch {
			if (markingAll) {
				targets.forEach((goal) => revertMarkedItem(goal));
			}
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось обновить цели «работаю сегодня»',
			});
		} finally {
			setIsBulkTodayUpdating(false);
		}
	};

	const goToPage = async (page: number): Promise<boolean> => {
		await loadGoalsInProgress(page);
		scroller.scrollTo('user-self-progress-goals', {
			duration: 800,
			delay: 0,
			smooth: 'easeInOutQuart',
			offset: -150,
		});
		return true;
	};

	const isInitialLoading = isLoading && goals.length === 0;
	const goalsToRender = activeTab === 'today' ? todayDisplayGoals : filteredAllGoals;
	const showPremiumDemo = !isPremium && !isInitialLoading && goals.length === 0;

	const buttonsSwitch = [
		{url: '#today', name: 'На сегодня', page: 'today' as const, count: activeTab === 'today' ? todayTabCount : todayCount},
		{url: '#all', name: 'Все цели', page: 'all' as const, count: pagination?.totalItems ?? goals.length},
	];

	return (
		<section className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Прогресс целей
				</Title>
			</div>
			<div className={element('content')}>
				{showPremiumDemo ? (
					<>
						<Banner
							type="gold"
							className={element('premium-banner')}
							title="Прогресс по целям — Premium"
							message="Отслеживайте выполнение, отмечайте работу по дням и ведите историю прогресса. Функция доступна с подпиской Premium."
							actionText="Оформить Premium"
							onAction={() => navigate('/premium')}
						/>
						<p className={element('demo-caption')}>Так мог бы выглядеть ваш раздел:</p>
						<div className={element('goals-grid', {demo: true})}>
							{DEMO_PROGRESS_GOALS.map((goal) => (
								<RegularCard
									key={goal.id}
									variant="progress"
									progressGoal={goal}
									demoMode
									className="catalog-items__goal catalog-items__goal--full"
								/>
							))}
						</div>
					</>
				) : (
					<>
						{!isPremium && goals.length > 0 && (
							<Banner
								type="info"
								className={element('premium-banner')}
								message="Редактирование прогресса доступно с Premium. Вы можете выполнить цель или удалить её из активных."
								actionText="Premium"
								onAction={() => navigate('/premium')}
							/>
						)}
						<div className="catalog-items__filters">
							<Switch className="catalog-items__switch" buttons={buttonsSwitch} active={activeTab} />
							<Line className="catalog-items__line" />
							{activeTab === 'today' ? (
								<div>
									<Button
										theme="blue-light"
										size="medium"
										width="full"
										icon={allMarkedOnPage ? 'regular' : 'regular-empty'}
										onClick={handleToggleCompleteAllToday}
										disabled={!canEditProgress || isBulkTodayUpdating || goals.length === 0}
										hoverContent={allMarkedOnPage ? 'Снять отметку со всех на странице' : undefined}
										hoverIcon={allMarkedOnPage ? 'cross' : undefined}
									>
										{allMarkedOnPage ? 'Все отмечены на сегодня' : 'Отметить все сегодня'}
									</Button>
								</div>
							) : (
								<div className="catalog-items__search-wrapper catalog-items__search-wrapper--wrap-on-lg">
									<FieldInput
										className="catalog-items__search"
										placeholder="Поиск по названию цели"
										id="user-self-progress-search"
										value={search}
										setValue={handleSearchChange}
										iconBegin="search"
									/>
									<div className="catalog-items__categories-wrapper">
										<FiltersDrawer
											filters={drawerFilters}
											values={filterValues}
											onChange={handleFilterChange}
											onReset={handleFilterReset}
											totalCount={filteredAllGoals.length}
										/>
										<Select options={SORT_OPTIONS} activeOption={activeSort} onSelect={handleSortSelect} filter />
									</div>
								</div>
							)}
						</div>

						{isInitialLoading ? (
							<CatalogItemsSkeleton columns="3" />
						) : (
							<BlurLoader active={isPageLoading}>
								{goals.length === 0 ? (
									<EmptyState
										title="Прогресс для целей не установлен"
										description="Задайте отслеживание прогресса выполнения в любой активной цели"
									>
										<Button theme="blue" width="auto" type="Link" href="/user/self/active-goals">
											Перейти к активным целям
										</Button>
									</EmptyState>
								) : goalsToRender.length === 0 ? (
									<EmptyState
										title={activeTab === 'today' ? 'Нет целей на сегодня' : 'Нет целей'}
										description={
											activeTab === 'today'
												? goals.length > 0 && !goals.some((g) => !g.isWorkingToday)
													? 'На этой странице все цели уже отмечены на сегодня. Переключитесь на «Все цели» или другую страницу.'
													: 'Список целей, по которым ещё не отмечено «работал сегодня».'
												: 'Не найдено ни одной цели с заданным прогрессом'
										}
									/>
								) : (
									<div className={element('goals-grid')} id="user-self-progress-goals">
										{goalsToRender.map((goal) => (
											<RegularCard
												key={goal.id}
												variant="progress"
												progressGoal={goal}
												canEditProgress={canEditProgress}
												onOpenProgressModal={() => openProgressModal(goal)}
												onMarkToday={() => markToday(goal)}
												onMarkCompleted={() => markGoalCompleted(goal)}
												className="catalog-items__goal catalog-items__goal--full"
											/>
										))}
									</div>
								)}
							</BlurLoader>
						)}

						{pagination && pagination.totalPages > 1 && (
							<Pagination currentPage={currentPage} totalPages={pagination.totalPages} goToPage={goToPage} />
						)}
					</>
				)}
			</div>
		</section>
	);
});
