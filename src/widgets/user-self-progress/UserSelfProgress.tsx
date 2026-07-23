import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';

import {getGoalsInProgress, IGoalProgress, updateGoalProgress} from '@/entities/goal/api/goals';
import {DEMO_PROGRESS_GOALS} from '@/entities/goal/lib/progressDemoGoals';
import {isPremiumSubscriptionActive} from '@/entities/regular-goal/lib/checkRegularGoalsAddLimit';
import {RegularCard} from '@/entities/regular-goal/ui/RegularCard/RegularCard';
import {getUser} from '@/entities/user/api/getUser';
import {UserStore} from '@/entities/user/model/UserStore';
import {CatalogItemsSkeleton} from '@/features/catalog-items/CatalogItemsSkeleton';
import {useBem} from '@/shared/lib/hooks/useBem';
import {useTodayTabDisplayList} from '@/shared/lib/hooks/useTodayTabDisplayList';
import {getMultiValueParam, getPageParam, getSingleValueParam, getSortIndexParam} from '@/shared/lib/urlListState';
import {ModalStore} from '@/shared/model/ModalStore';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {IPaginationPage} from '@/shared/types/request';
import {Banner} from '@/shared/ui/Banner/Banner';
import {Button} from '@/shared/ui/Button/Button';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';
import {FieldInput} from '@/shared/ui/FieldInput/FieldInput';
import {FiltersDrawer, FilterGroup} from '@/shared/ui/FiltersDrawer/FiltersDrawer';
import {Line} from '@/shared/ui/Line/Line';
import {BlurLoader} from '@/shared/ui/Loader/BlurLoader';
import {Pagination} from '@/shared/ui/Pagination/Pagination';
import Select, {OptionSelect} from '@/shared/ui/Select/Select';
import {Switch} from '@/shared/ui/Switch/Switch';
import {Title} from '@/shared/ui/Title/Title';

import '@/features/catalog-items/catalog-items.scss';
import '@/widgets/user-self-progress/user-self-progress.scss';

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
	const skipTabSyncRef = useRef(true);
	const loadGenerationRef = useRef(0);

	const [searchParams] = useSearchParams();

	const [goals, setGoals] = useState<IGoalProgress[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
	const [activeSort, setActiveSort] = useState(() => getSortIndexParam(searchParams, 'sort', SORT_OPTIONS));
	const [filterValues, setFilterValues] = useState<Record<string, string[]>>(() => ({
		categories: getMultiValueParam(searchParams, 'categories'),
		complexity: getSingleValueParam(searchParams, 'complexity'),
	}));
	const [pagination, setPagination] = useState<IPaginationPage | null>(null);
	const [currentPage, setCurrentPage] = useState(() => getPageParam(searchParams));
	const [isPageLoading, setIsPageLoading] = useState(false);
	const [todayCount, setTodayCount] = useState<number>(0);
	const [allTotalCount, setAllTotalCount] = useState<number>(0);
	const [isBulkTodayUpdating, setIsBulkTodayUpdating] = useState(false);
	const [listRevision, setListRevision] = useState(0);

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
		resetDisplayItems,
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

	// Синхронизируем поиск/фильтры/сортировку/страницу с URL, чтобы кнопка "назад" в браузере
	// восстанавливала то же состояние списка.
	// Важно: setSearchParams сбрасывает hash — из‑за этого #all превращался в «сегодня».
	const syncProgressUrl = useCallback(
		(overrides: {search?: string; sortIndex?: number; filters?: Record<string, string[]>; page?: number; hash?: string}) => {
			const nextSearch = overrides.search ?? search;
			const nextSortIndex = overrides.sortIndex ?? activeSort;
			const nextFilters = overrides.filters ?? filterValues;
			const nextPage = overrides.page ?? currentPage;
			const next = new URLSearchParams(searchParams);

			if (nextSearch.trim()) {
				next.set('search', nextSearch.trim());
			} else {
				next.delete('search');
			}

			if (nextFilters['categories']?.length > 0) {
				next.set('categories', nextFilters['categories'].join(','));
			} else {
				next.delete('categories');
			}

			if (nextFilters['complexity']?.length > 0) {
				next.set('complexity', nextFilters['complexity'][0]);
			} else {
				next.delete('complexity');
			}

			if (nextSortIndex > 0 && SORT_OPTIONS[nextSortIndex]) {
				next.set('sort', SORT_OPTIONS[nextSortIndex].value);
			} else {
				next.delete('sort');
			}

			if (nextPage > 1) {
				next.set('page', String(nextPage));
			} else {
				next.delete('page');
			}

			const query = next.toString();
			navigate(
				{
					pathname: location.pathname,
					search: query ? `?${query}` : '',
					hash: overrides.hash ?? location.hash,
				},
				{replace: true}
			);
		},
		[search, activeSort, filterValues, currentPage, searchParams, navigate, location.pathname, location.hash]
	);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		syncProgressUrl({search: value});
	};
	const handleFilterChange = (key: string, selected: string[]) => {
		const nextFilters = {...filterValues, [key]: selected};
		setFilterValues(nextFilters);
		syncProgressUrl({filters: nextFilters});
	};
	const handleFilterReset = () => {
		const nextFilters = {categories: [], complexity: []};
		setFilterValues(nextFilters);
		syncProgressUrl({filters: nextFilters});
	};

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
	const handleSortSelect = (index: number) => {
		setActiveSort(index);
		syncProgressUrl({sortIndex: index});
	};

	const {setIsOpen, setWindow, setModalProps} = ModalStore;

	const loadGoalsInProgress = useCallback(
		async (page = 1, options?: {silent?: boolean; forToday?: boolean}) => {
			const forToday = options?.forToday ?? activeTab === 'today';
			const generation = ++loadGenerationRef.current;

			if (!options?.silent) {
				setIsLoading(page === 1);
				setIsPageLoading(page > 1);
			}

			try {
				const response = await getGoalsInProgress({
					page,
					...(forToday ? {for_today: true} : {}),
				});
				if (generation !== loadGenerationRef.current) {
					return;
				}

				if (response.success && response.data) {
					const data = response.data as
						| IGoalProgress[]
						| {
								pagination: IPaginationPage;
								data: IGoalProgress[];
								todayCount?: number;
								totalCount?: number;
						  };

					if (Array.isArray(data)) {
						setGoals(data);
						setPagination({
							itemsPerPage: data.length,
							page: 1,
							totalPages: 1,
							totalItems: data.length,
						});
						setCurrentPage(1);
						setTodayCount(data.filter((g) => !g.isWorkingToday).length);
						if (!forToday) {
							setAllTotalCount(data.length);
						}
						if (!options?.silent) {
							setListRevision((value) => value + 1);
						}
					} else {
						setGoals(data.data);
						setPagination(data.pagination);
						setCurrentPage(data.pagination.page);
						if (data.todayCount !== undefined) {
							setTodayCount(data.todayCount);
						} else {
							setTodayCount(data.data.filter((g) => !g.isWorkingToday).length);
						}
						if (data.totalCount !== undefined) {
							setAllTotalCount(data.totalCount);
						} else if (!forToday) {
							setAllTotalCount(data.pagination.totalItems);
						}
						if (!options?.silent) {
							setListRevision((value) => value + 1);
						}
					}
				}
			} catch {
				if (generation !== loadGenerationRef.current) {
					return;
				}
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Не удалось загрузить цели в процессе',
				});
			} finally {
				if (generation === loadGenerationRef.current && !options?.silent) {
					setIsLoading(false);
					setIsPageLoading(false);
				}
			}
		},
		[activeTab]
	);

	const refreshProgressAndProfile = async (page: number, options?: {silent?: boolean}) => {
		await loadGoalsInProgress(page, options);
		await getUser();
	};

	useEffect(() => {
		loadGoalsInProgress(currentPage);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (skipProgressCountSyncRef.current) {
			skipProgressCountSyncRef.current = false;
			return;
		}

		loadGoalsInProgress(currentPage, {silent: goals.length > 0}).catch(() => {});
		// Только при изменении числа прогрессов в профиле — не при смене страницы (иначе двойной fetch)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [progressGoalsCount]);

	useEffect(() => {
		if (skipTabSyncRef.current) {
			skipTabSyncRef.current = false;
			return;
		}

		setCurrentPage(1);
		if (activeTab === 'today') {
			setSearch('');
			setFilterValues({categories: [], complexity: []});
			syncProgressUrl({page: 1, search: '', filters: {categories: [], complexity: []}});
		} else {
			syncProgressUrl({page: 1});
		}
		loadGoalsInProgress(1, {forToday: activeTab === 'today'}).catch(() => {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	useEffect(() => {
		if (activeTab === 'today') {
			resetDisplayItems();
		}
	}, [listRevision, activeTab, resetDisplayItems]);

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
				progress_percentage: goal.progressPercentage ?? 0,
				daily_notes: goal.dailyNotes || '',
				is_working_today: marking,
			});

			if (updateResponse.success && updateResponse.data && updateResponse.data.isWorkingToday === marking) {
				const updated = updateResponse.data;
				mergeGoalUpdate(updated);

				if (marking) {
					applyMarkedItem(goal, updated);
				} else {
					applyUnmarkedItem(updated);
				}

				refreshProgressAndProfile(currentPage, {silent: true}).catch(() => {});
			} else {
				revertMarkedItem(goal);
			}
		} catch {
			revertMarkedItem(goal);
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

		const markingAll = pendingTodayOnPage.length > 0;
		const targets = markingAll ? pendingTodayOnPage : markedTodayOnPage;

		if (targets.length === 0) {
			return;
		}

		setIsBulkTodayUpdating(true);

		if (markingAll) {
			markAllItems(targets, (goal) => buildMarkedProgressGoal(goal, true));
		} else {
			unmarkAllItems(targets);
		}

		try {
			const responses = await Promise.all(
				targets.map((goal) =>
					updateGoalProgress(goal.goal, {
						progress_percentage: goal.progressPercentage ?? 0,
						daily_notes: goal.dailyNotes || '',
						is_working_today: markingAll,
					})
				)
			);

			let successCount = 0;

			responses.forEach((response, index) => {
				const goal = targets[index];
				const updated = response.data;
				const isExpectedState = !!updated && updated.isWorkingToday === markingAll;

				if (!response.success || !isExpectedState) {
					revertMarkedItem(goal);
					return;
				}

				successCount += 1;
				mergeGoalUpdate(updated);

				if (markingAll) {
					applyMarkedItem(goal, updated);
				} else {
					applyUnmarkedItem(updated);
				}
			});

			await refreshProgressAndProfile(currentPage, {silent: true});

			if (successCount === 0) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: 'Не удалось обновить цели «работаю сегодня»',
				});
			} else if (successCount < targets.length) {
				NotificationStore.addNotification({
					type: 'warning',
					title: 'Частично обновлено',
					message: `Отмечено ${successCount} из ${targets.length} целей`,
				});
			}
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
		if (page === currentPage) {
			return true;
		}

		setCurrentPage(page);
		syncProgressUrl({page});
		await loadGoalsInProgress(page);
		return true;
	};

	const isInitialLoading = isLoading && goals.length === 0;
	const goalsToRender = activeTab === 'today' ? todayDisplayGoals : filteredAllGoals;
	const showPremiumDemo = !isPremium && !isInitialLoading && goals.length === 0;

	const buttonsSwitch = [
		{url: '#today', name: 'На сегодня', page: 'today' as const, count: todayCount},
		{url: '#all', name: 'Все цели', page: 'all' as const, count: allTotalCount || pagination?.totalItems || goals.length},
	];

	return (
		<section className={block()} id="user-self-progress">
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
										title={activeTab === 'today' ? 'Нет целей на сегодня' : 'Прогресс для целей не установлен'}
										description={
											activeTab === 'today'
												? 'Все цели уже отмечены на сегодня или прогресс ещё не начат.'
												: 'Задайте отслеживание прогресса выполнения в любой активной цели'
										}
									>
										{activeTab !== 'today' && (
											<Button theme="blue" width="auto" type="Link" href="/user/self/active-goals">
												Перейти к активным целям
											</Button>
										)}
									</EmptyState>
								) : goalsToRender.length === 0 ? (
									<EmptyState
										title={activeTab === 'today' ? 'Нет целей на сегодня' : 'Нет целей'}
										description={
											activeTab === 'today'
												? 'Список целей, по которым ещё не отмечено «работал сегодня».'
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
							<Pagination
								currentPage={currentPage}
								totalPages={pagination.totalPages}
								goToPage={goToPage}
								scrollToId="user-self-progress"
							/>
						)}
					</>
				)}
			</div>
		</section>
	);
});
