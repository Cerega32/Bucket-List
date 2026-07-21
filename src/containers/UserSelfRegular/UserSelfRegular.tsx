import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router-dom';

import {Banner} from '@/components/Banner/Banner';
import {Button} from '@/components/Button/Button';
import {RegularCard} from '@/components/Card/RegularCard';
import {CatalogItemsSkeleton} from '@/components/CatalogItems/CatalogItemsSkeleton';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {FieldCheckbox} from '@/components/FieldCheckbox/FieldCheckbox';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {FilterGroup, FiltersDrawer} from '@/components/FiltersDrawer/FiltersDrawer';
import {Line} from '@/components/Line/Line';
import {RegularGoalsPremiumLimitModal} from '@/components/RegularGoalsPremiumLimitModal/RegularGoalsPremiumLimitModal';
import Select, {OptionSelect} from '@/components/Select/Select';
import {Switch} from '@/components/Switch/Switch';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {useTodayTabDisplayList} from '@/hooks/useTodayTabDisplayList';
import {CategoriesStore} from '@/store/CategoriesStore';
import {HeaderRegularGoalsStore} from '@/store/HeaderRegularGoalsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {ICategoryTree, IGoal, IRegularGoalStatistics} from '@/typings/goal';
import {getUser} from '@/utils/api/get/getUser';
import {getRegularGoalStatistics, markRegularProgress, restartRegularGoal} from '@/utils/api/goals';
import {selectRegularGoalSlots} from '@/utils/api/post/selectRegularGoalSlots';
import {isPremiumSubscriptionActive} from '@/utils/regularGoal/checkRegularGoalsAddLimit';
import {
	compareRegularGoalsActiveFirst,
	extractRegularGoalStatistics,
	isRegularGoalCompletedToday,
	isRegularGoalPendingForToday,
	isRegularGoalShownInTodayViews,
} from '@/utils/regularGoal/regularGoalTodayVisibility';
import {getMultiValueParam, getSingleValueParam, getSortIndexParam} from '@/utils/urlListState';
import './user-self-regular.scss';

interface UserSelfRegularProps {
	className?: string;
}

const SORT_OPTIONS: OptionSelect[] = [
	{
		name: 'Новые',
		value: 'added_at_desc',
	},
	{
		name: 'Старые',
		value: 'added_at_asc',
	},
	{
		name: 'Лучший прогресс',
		value: 'progress_desc',
	},
];

const extractMarkProgressStatistics = (
	responseData: {data?: {statistics?: IRegularGoalStatistics}; statistics?: IRegularGoalStatistics} | undefined
): IRegularGoalStatistics | undefined => responseData?.data?.statistics ?? responseData?.statistics;

const buildCompletedSnapshot = (stats: IRegularGoalStatistics): IRegularGoalStatistics => {
	const progress = stats.currentPeriodProgress;

	if (progress?.type === 'daily') {
		return {
			...stats,
			canCompleteToday: false,
			currentPeriodProgress: {
				...progress,
				completedToday: true,
			},
		};
	}

	return {
		...stats,
		canCompleteToday: false,
	};
};

export const UserSelfRegular: FC<UserSelfRegularProps> = observer(({className}) => {
	const [block, element] = useBem('user-self-regular', className);
	const location = useLocation();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const {userSelf} = UserStore;
	const activeTab = (location.hash === '#all' ? 'all' : 'today') as 'today' | 'all';

	const [statisticsData, setStatisticsData] = useState<IRegularGoalStatistics[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
	const [activeSort, setActiveSort] = useState(() => getSortIndexParam(searchParams, 'sort', SORT_OPTIONS));
	const [filterValues, setFilterValues] = useState<Record<string, string[]>>(() => ({
		categories: getMultiValueParam(searchParams, 'categories'),
		complexity: getSingleValueParam(searchParams, 'complexity'),
		hundredGoals: getSingleValueParam(searchParams, 'hundred_goals'),
	}));
	const statisticsLoadGenerationRef = useRef(0);
	const refreshTodayTabAfterSlotsRef = useRef(false);
	const prevSubscriptionStateKeyRef = useRef<string | null>(null);
	const [todayCountFromApi, setTodayCountFromApi] = useState<number | null>(null);
	const [isBulkTodayUpdating, setIsBulkTodayUpdating] = useState(false);
	const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
	const [isSavingSlots, setIsSavingSlots] = useState(false);
	const [isChangingSlots, setIsChangingSlots] = useState(false);
	const [isPremiumLimitModalOpen, setIsPremiumLimitModalOpen] = useState(false);
	const [restartingGoalId, setRestartingGoalId] = useState<number | null>(null);

	const maxRegularGoals = userSelf.limits?.maxRegularGoals ?? 3;
	const isPremium = isPremiumSubscriptionActive(userSelf);
	const selectionPending = userSelf.regularGoalsSelectionPending ?? false;
	const showSlotSelection = selectionPending || isChangingSlots;
	const regularGoalsCount = userSelf.counts?.regularGoals ?? statisticsData.length;
	const regularGoalsLimitReached = regularGoalsCount >= maxRegularGoals;
	const hasPausedGoals = statisticsData.some((stats) => stats.isExecutionEnabled === false);
	const slotsLocked = userSelf.regularGoalsSlotsLocked ?? false;
	const lockedSlotIds = useMemo(
		() => statisticsData.filter((stats) => stats.slotExecutionLocked).map((stats) => stats.regularGoal),
		[statisticsData]
	);
	const canChangeSlots = !isPremium && hasPausedGoals && !selectionPending && !slotsLocked;
	const selectionPendingBannerMessage =
		'Premium закончился, а регулярных целей больше, чем позволяет бесплатный тариф. ' +
		'Выберите, какие цели продолжить — до выбора выполнение всех целей заблокировано.';
	const slotsChangeBannerMessage =
		lockedSlotIds.length > 0
			? `На бесплатном тарифе одновременно доступно ${maxRegularGoals} регулярных цели. ` +
			  `Цели с отметкой выполнения зафиксированы (${lockedSlotIds.length}/${maxRegularGoals}), ` +
			  'остальные слоты можно поменять.'
			: `На бесплатном тарифе одновременно доступно ${maxRegularGoals} регулярных цели. ` +
			  'Цели на паузе можно снова включить, выбрав другой набор.';
	const subscriptionStateKey = `${userSelf.subscriptionType ?? 'free'}|${userSelf.subscriptionExpiresAt ?? ''}|${
		userSelf.regularGoalsSelectionPending ?? false
	}|${userSelf.limits?.maxRegularGoals ?? 3}`;

	useEffect(() => {
		if (!selectionPending && !isChangingSlots) {
			return;
		}

		const enabledIds = statisticsData.filter((stats) => stats.isExecutionEnabled !== false).map((stats) => stats.regularGoal);
		const lockedIds = statisticsData.filter((stats) => stats.slotExecutionLocked).map((stats) => stats.regularGoal);
		const nextSelected = [...new Set([...lockedIds, ...enabledIds])].slice(0, maxRegularGoals);
		setSelectedSlotIds(nextSelected);
	}, [selectionPending, isChangingSlots, statisticsData, maxRegularGoals]);

	const loadRegularGoalStatistics = async (options?: {silent?: boolean}) => {
		const generation = ++statisticsLoadGenerationRef.current;

		if (!options?.silent) {
			setIsLoading(statisticsData.length === 0);
		}
		try {
			const response = await getRegularGoalStatistics();
			if (generation !== statisticsLoadGenerationRef.current) {
				return;
			}
			if (response.success && response.data) {
				const data = response.data as
					| IRegularGoalStatistics[]
					| {
							data: IRegularGoalStatistics[];
							todayCount?: number;
					  };

				if (Array.isArray(data)) {
					setStatisticsData(data);
					setTodayCountFromApi(null);
				} else {
					setStatisticsData(data.data);
					if (data.todayCount !== undefined) {
						setTodayCountFromApi(data.todayCount);
					}
				}
			}
		} catch (error) {
			if (generation !== statisticsLoadGenerationRef.current) {
				return;
			}
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось загрузить регулярные цели',
			});
		} finally {
			if (generation === statisticsLoadGenerationRef.current && !options?.silent) {
				setIsLoading(false);
			}
		}
	};

	useEffect(() => {
		loadRegularGoalStatistics();
	}, []);

	useEffect(() => {
		getUser();
	}, []);

	useEffect(() => {
		if (!selectionPending && !isChangingSlots) {
			return;
		}

		loadRegularGoalStatistics();
	}, [selectionPending, isChangingSlots]);

	useEffect(() => {
		if (prevSubscriptionStateKeyRef.current === null) {
			prevSubscriptionStateKeyRef.current = subscriptionStateKey;
			return;
		}

		if (prevSubscriptionStateKeyRef.current === subscriptionStateKey) {
			return;
		}

		prevSubscriptionStateKeyRef.current = subscriptionStateKey;

		if (isPremiumSubscriptionActive(userSelf)) {
			setIsChangingSlots(false);
		}

		refreshTodayTabAfterSlotsRef.current = true;
		loadRegularGoalStatistics();
	}, [subscriptionStateKey]);

	const categoryFilters = useMemo(() => {
		const categoriesMap = new Map<string, string>();

		statisticsData.forEach((stats) => {
			if (stats?.regularGoalData.goalCategory) {
				const name = stats.regularGoalData.goalCategory;
				if (!categoriesMap.has(name)) {
					categoriesMap.set(name, name);
				}
			}
		});

		return Array.from(categoriesMap.values()).map((name) => ({
			name,
			code: name,
		}));
	}, [statisticsData]);

	const filteredStatistics = () => {
		let result = [...statisticsData];

		if (search.trim()) {
			const query = search.trim().toLowerCase();
			result = result.filter((stats) => stats?.regularGoalData.goalTitle.toLowerCase().includes(query));
		}

		if (filterValues['categories'].length > 0) {
			result = result.filter((stats) => filterValues['categories'].includes(stats.regularGoalData.goalCategory));
		}

		const sortKey = SORT_OPTIONS[activeSort]?.value;

		result.sort((a, b) => {
			const activeOrder = compareRegularGoalsActiveFirst(a, b);
			if (activeOrder !== 0) {
				return activeOrder;
			}

			if (sortKey === 'added_at_desc') {
				return (b.regularGoalData.createdAt || '').localeCompare(a.regularGoalData.createdAt || '');
			}
			if (sortKey === 'added_at_asc') {
				return (a.regularGoalData.createdAt || '').localeCompare(b.regularGoalData.createdAt || '');
			}
			if (sortKey === 'progress_desc') {
				return (b.completionPercentage || 0) - (a.completionPercentage || 0);
			}

			return 0;
		});

		return result;
	};

	const isStatsCompletedToday = isRegularGoalCompletedToday;

	const isStatsRelevantForTodayTab = isRegularGoalShownInTodayViews;

	const getTodayRelevantGoals = () => {
		return filteredStatistics().filter((stats) => {
			if (!stats) return false;
			if (stats.isExecutionEnabled === false) return false;
			return isStatsRelevantForTodayTab(stats);
		});
	};

	const buildPendingTodayGoals = useCallback(() => {
		return getTodayRelevantGoals()
			.filter((stats) => isRegularGoalPendingForToday(stats))
			.sort((a, b) => {
				const activeOrder = compareRegularGoalsActiveFirst(a, b);
				if (activeOrder !== 0) {
					return activeOrder;
				}
				if (a.isInterrupted !== b.isInterrupted) return a.isInterrupted ? 1 : -1;
				return 0;
			});
	}, [statisticsData, search, filterValues, activeSort]);

	const mergeStatisticsUpdate = useCallback((updated: IRegularGoalStatistics) => {
		setStatisticsData((prev) => {
			const index = prev.findIndex((item) => item.regularGoal === updated.regularGoal);
			if (index === -1) {
				return [...prev, updated];
			}

			const next = [...prev];
			next[index] = updated;
			return next;
		});
	}, []);

	const {
		displayItems: todayDisplayGoals,
		todayTabCount,
		resetDisplayItems,
		applyMarkedItem,
		applyUnmarkedItem,
		revertMarkedItem,
		applyRestartedItem,
		markAllItems,
		unmarkAllItems,
	} = useTodayTabDisplayList({
		activeTab,
		isSourceReady: !isLoading && statisticsData.length > 0,
		buildPendingItems: buildPendingTodayGoals,
		getItemId: (stats) => stats.regularGoal,
	});

	useEffect(() => {
		if (!refreshTodayTabAfterSlotsRef.current || showSlotSelection) {
			return;
		}

		resetDisplayItems();
	}, [statisticsData, showSlotSelection, resetDisplayItems]);

	// Синхронизируем поиск/фильтры/сортировку с URL, чтобы кнопка "назад" в браузере
	// восстанавливала то же состояние списка
	const syncRegularUrl = useCallback(
		(overrides: {search?: string; sortIndex?: number; filters?: Record<string, string[]>}) => {
			const nextSearch = overrides.search ?? search;
			const nextSortIndex = overrides.sortIndex ?? activeSort;
			const nextFilters = overrides.filters ?? filterValues;

			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);

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

					if (nextFilters['hundredGoals']?.length > 0) {
						next.set('hundred_goals', nextFilters['hundredGoals'][0]);
					} else {
						next.delete('hundred_goals');
					}

					if (nextSortIndex > 0 && SORT_OPTIONS[nextSortIndex]) {
						next.set('sort', SORT_OPTIONS[nextSortIndex].value);
					} else {
						next.delete('sort');
					}

					return next;
				},
				{replace: true}
			);
		},
		[search, activeSort, filterValues, setSearchParams]
	);

	useEffect(() => {
		if (activeTab !== 'today') {
			return;
		}

		setSearch('');
		setFilterValues({categories: [], complexity: [], hundredGoals: []});
		syncRegularUrl({search: '', filters: {categories: [], complexity: [], hundredGoals: []}});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab]);

	const handleSortSelect = async (active: number): Promise<void> => {
		setActiveSort(active);
		syncRegularUrl({sortIndex: active});
	};

	const handleSearchChange = (value: string) => {
		setSearch(value);
		syncRegularUrl({search: value});
	};

	const handleFilterChange = (key: string, selected: string[]) => {
		const nextFilters = {...filterValues, [key]: selected};
		setFilterValues(nextFilters);
		syncRegularUrl({filters: nextFilters});
	};

	const handleFilterReset = () => {
		const nextFilters = {categories: [], complexity: [], hundredGoals: []};
		setFilterValues(nextFilters);
		syncRegularUrl({filters: nextFilters});
	};

	const drawerFilters = useMemo((): FilterGroup[] => {
		const groups: FilterGroup[] = [];
		if (categoryFilters.length > 0) {
			groups.push({
				key: 'categories',
				label: 'Категории',
				options: categoryFilters,
				multiple: true,
				allLabel: 'Все категории',
			});
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
		groups.push({
			key: 'hundredGoals',
			label: '100 целей',
			options: [
				{name: 'Только из 100 целей', code: 'only'},
				{name: 'Исключить 100 целей', code: 'exclude'},
			],
			allLabel: 'Все цели',
		});
		return groups;
	}, [categoryFilters]);

	const handleProgressUpdate = async (stats: IRegularGoalStatistics) => {
		if (selectionPending || isChangingSlots || stats.isExecutionEnabled === false) {
			return;
		}

		let newCompletedState = false;

		try {
			// Определяем текущее состояние выполнения по статистике
			const progress = stats.currentPeriodProgress;
			let currentlyCompleted = false;

			if (progress?.type === 'daily') {
				currentlyCompleted = progress.completedToday || false;
			} else {
				// Для weekly/custom: если нельзя выполнить сегодня, значит уже выполнено
				currentlyCompleted = !stats.canCompleteToday || false;
			}

			newCompletedState = !currentlyCompleted;

			if (newCompletedState) {
				applyMarkedItem(stats, buildCompletedSnapshot(stats));
			} else {
				applyUnmarkedItem(stats);
			}

			const response = await markRegularProgress({
				regular_goal_id: stats.regularGoal,
				completed: newCompletedState,
				notes: '',
			});

			if (response.success) {
				const updatedStats = extractMarkProgressStatistics(response.data);
				const snapshot = updatedStats ?? (newCompletedState ? buildCompletedSnapshot(stats) : stats);

				if (updatedStats) {
					mergeStatisticsUpdate(updatedStats);
				} else if (newCompletedState) {
					mergeStatisticsUpdate(buildCompletedSnapshot(stats));
				}

				if (newCompletedState) {
					applyMarkedItem(stats, snapshot);
				} else {
					applyUnmarkedItem(snapshot);
				}

				loadRegularGoalStatistics({silent: true}).catch(() => {});
				await getUser();
				HeaderRegularGoalsStore.loadTodayCount();

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успешно!',
					message: newCompletedState ? 'Цель отмечена как выполненная' : 'Отметка о выполнении снята',
				});
			} else if (newCompletedState) {
				revertMarkedItem(stats);
			}
		} catch (error) {
			if (newCompletedState) {
				revertMarkedItem(stats);
			}

			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось отметить прогресс',
			});
		}
	};

	const handleRestart = async (stats: IRegularGoalStatistics) => {
		if (selectionPending || isChangingSlots || stats.isExecutionEnabled === false || restartingGoalId !== null) {
			return;
		}

		setRestartingGoalId(stats.regularGoal);

		try {
			const response = await restartRegularGoal(stats.regularGoal);

			if (response.success) {
				const updatedStats =
					extractRegularGoalStatistics(response.data) ??
					({
						...stats,
						isInterrupted: false,
						interruptedStreak: null,
						interruptedCompletionPercentage: null,
						currentStreak: 0,
						completionPercentage: 0,
						isSeriesCompleted: false,
					} as IRegularGoalStatistics);

				mergeStatisticsUpdate(updatedStats);
				applyRestartedItem(updatedStats, isStatsRelevantForTodayTab(updatedStats));

				loadRegularGoalStatistics({silent: true}).catch(() => {});
				HeaderRegularGoalsStore.loadTodayCount();

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успешно!',
					message: 'Серия начата заново',
				});
			} else {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: response.error || 'Не удалось начать серию заново',
				});
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось начать серию заново',
			});
		} finally {
			setRestartingGoalId(null);
		}
	};

	const getAllGoals = () => {
		return filteredStatistics();
	};

	const todayRelevantGoals = getTodayRelevantGoals();
	const allGoals = getAllGoals();
	const todayGoalsToRender = useMemo(() => [...todayDisplayGoals].sort(compareRegularGoalsActiveFirst), [todayDisplayGoals]);

	const completableTodayGoals = todayRelevantGoals.filter(
		(s) => !s.isInterrupted && s.isExecutionEnabled !== false && !selectionPending && !isChangingSlots
	);
	const areAllTodayCompleted = completableTodayGoals.length > 0 && completableTodayGoals.every((stats) => isStatsCompletedToday(stats));

	const buttonsSwitch = [
		{
			url: '#today',
			name: 'На сегодня',
			page: 'today',
			count: todayCountFromApi ?? todayTabCount,
		},
		{
			url: '#all',
			name: 'Все цели',
			page: 'all',
			count: allGoals.length,
		},
	];

	const toggleSlotSelection = (regularGoalId: number) => {
		if (lockedSlotIds.includes(regularGoalId)) {
			return;
		}

		setSelectedSlotIds((prev) => {
			if (prev.includes(regularGoalId)) {
				return prev.filter((id) => id !== regularGoalId);
			}
			if (prev.length >= maxRegularGoals) {
				return prev;
			}
			return [...prev, regularGoalId];
		});
	};

	const handleSaveSlotSelection = async () => {
		if (selectedSlotIds.length === 0) {
			NotificationStore.addNotification({
				type: 'warning',
				title: 'Выберите цели',
				message: `Отметьте до ${maxRegularGoals} регулярных целей, которые хотите продолжить выполнять.`,
			});
			return;
		}

		setIsSavingSlots(true);
		try {
			const selectedIds = [...selectedSlotIds];
			const response = await selectRegularGoalSlots(selectedIds);
			if (response.success) {
				refreshTodayTabAfterSlotsRef.current = true;
				setIsChangingSlots(false);
				setStatisticsData((prev) =>
					prev.map((stats) => ({
						...stats,
						isExecutionEnabled: selectedIds.includes(stats.regularGoal),
					}))
				);
				if (response.data?.regularGoalsSelectionPending === false) {
					UserStore.setUserSelf({
						...UserStore.userSelf,
						regularGoalsSelectionPending: false,
					});
				}
				await loadRegularGoalStatistics();
				await getUser();
				refreshTodayTabAfterSlotsRef.current = false;
				HeaderRegularGoalsStore.loadTodayCount();
				NotificationStore.addNotification({
					type: 'success',
					title: 'Готово',
					message: 'Активные регулярные цели обновлены',
				});
			} else {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: typeof response.error === 'string' ? response.error : 'Не удалось сохранить выбор',
				});
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось сохранить выбор',
			});
		} finally {
			setIsSavingSlots(false);
		}
	};

	const renderSlotSelection = () => (
		<div className={element('slot-selection')}>
			<p className={element('slot-selection-text')}>
				Выберите до {maxRegularGoals} регулярных целей, которые останутся активными на бесплатном тарифе. Остальные сохранятся, но
				выполнение будет на паузе.
			</p>
			<div className={element('slot-selection-list')}>
				{statisticsData.map((stats) => {
					const isSelected = selectedSlotIds.includes(stats.regularGoal);
					const isExecutionLocked = stats.slotExecutionLocked === true;
					const isDisabled = (isExecutionLocked && isSelected) || (!isSelected && selectedSlotIds.length >= maxRegularGoals);

					return (
						<div
							key={stats.regularGoal}
							className={element('slot-selection-item', {
								selected: isSelected,
								disabled: isDisabled,
								locked: isExecutionLocked && isSelected,
							})}
						>
							<FieldCheckbox
								className={element('slot-selection-checkbox')}
								id={`regular-slot-${stats.regularGoal}`}
								checked={isSelected}
								disabled={isDisabled}
								setChecked={(checked) => {
									if (isDisabled) {
										return;
									}

									const isCurrentlySelected = selectedSlotIds.includes(stats.regularGoal);
									if (checked !== isCurrentlySelected) {
										toggleSlotSelection(stats.regularGoal);
									}
								}}
								text={
									<span className={element('slot-selection-content')}>
										<img
											src={stats.regularGoalData.goalImage}
											alt={stats.regularGoalData.goalTitle}
											className={element('slot-selection-image')}
										/>
										<span className={element('slot-selection-title')}>{stats.regularGoalData.goalTitle}</span>
									</span>
								}
							/>
						</div>
					);
				})}
			</div>
			<div className={element('slot-selection-actions')}>
				<Button
					theme="blue"
					size="small"
					width="auto"
					onClick={handleSaveSlotSelection}
					loading={isSavingSlots}
					loadingText="Сохранение..."
					disabled={selectedSlotIds.length === 0}
				>
					{`Сохранить выбор (${selectedSlotIds.length}/${maxRegularGoals})`}
				</Button>
				{isChangingSlots && !selectionPending && (
					<Button
						theme="blue-light"
						size="small"
						width="auto"
						onClick={() => {
							setIsChangingSlots(false);
							loadRegularGoalStatistics();
						}}
					>
						Отмена
					</Button>
				)}
			</div>
		</div>
	);

	// Функция для поиска категории по имени в дереве категорий
	const findCategoryByName = (name: string, categories: ICategoryTree[]): ICategoryTree | null => {
		const found = categories.find((category) => category.name === name);
		if (found) {
			return found;
		}

		const foundInChildren = categories
			.filter((category) => category.children && category.children.length > 0)
			.map((category) => findCategoryByName(name, category.children))
			.find((result) => result !== null);

		return foundInChildren || null;
	};

	// Конвертируем статистику в формат IGoal для совместимости с RegularGoalCard
	const convertStatsToGoal = (stats: IRegularGoalStatistics): IGoal => {
		const categoryName = stats.regularGoalData.goalCategory;
		const foundCategory = findCategoryByName(categoryName, CategoriesStore.categoriesTree);
		const categoryNameEn = foundCategory?.nameEn || categoryName;

		return {
			id: stats.regularGoalData.goal,
			title: stats.regularGoalData.goalTitle,
			description: '',
			shortDescription: '',
			category: {
				id: foundCategory?.id || 0,
				name: categoryName,
				nameEn: categoryNameEn,
				parentCategory: foundCategory?.parentCategory || null,
			},
			subcategory: {
				id: foundCategory?.id || 0,
				name: categoryName,
				nameEn: categoryNameEn,
				parentCategory: foundCategory?.parentCategory || null,
			},
			lists: [],
			listsCount: 0,
			hasMyComment: false,
			complexity: 'medium' as const,
			image: stats.regularGoalData.goalImage,
			code: stats.regularGoalData.goalCode,
			estimatedTime: undefined,
			createdBy: {
				id: stats.user,
				username: stats.userUsername,
				avatar: undefined,
			},
			location: undefined,
			totalAdded: 0,
			totalCompleted: 0,
			addedByUser: true,
			completedByUser: false,
			createdAt: stats.regularGoalData.createdAt,
			addedFromList: [],
			timer: null,
			userVisitedLocation: false,
			userFolders: [],
			regularConfig: {
				id: stats.regularGoal,
				frequency: stats.regularGoalData.frequency,
				weeklyFrequency: stats.regularGoalData.weeklyFrequency,
				customSchedule: stats.regularGoalData.customSchedule,
				durationType: stats.regularGoalData.durationType,
				durationValue: stats.regularGoalData.durationValue,
				endDate: stats.regularGoalData.endDate,
				allowSkipDays: stats.regularGoalData.allowSkipDays,
				resetOnSkip: stats.regularGoalData.resetOnSkip,
				allowCustomSettings: false,
				isActive: stats.regularGoalData.isActive,
				createdAt: stats.regularGoalData.createdAt,
				statistics: stats,
			},
			createdByUser: true,
			isCanEdit: false,
			totalComments: 0,
			totalLists: 0,
			categoryRank: 1,
			totalAdditions: 0,
		};
	};

	const renderGoalsList = (statsArray: IRegularGoalStatistics[], emptyMessage: string, emptyDescription: string) => {
		if (statsArray.length === 0) {
			return <EmptyState title={emptyMessage} description={emptyDescription} className={element('empty-section')} />;
		}

		return (
			<div className={element('goals-grid')}>
				{statsArray.map((stats) => {
					const goal = convertStatsToGoal(stats);

					return (
						<RegularCard
							key={stats.regularGoal}
							regularGoal={goal}
							statistics={stats}
							onMarkRegular={() => handleProgressUpdate(stats)}
							onRestart={() => handleRestart(stats)}
							isPrimaryActionLoading={restartingGoalId === stats.regularGoal}
							className="catalog-items__goal catalog-items__goal--full"
						/>
					);
				})}
			</div>
		);
	};

	const handleToggleCompleteAllToday = async () => {
		if (completableTodayGoals.length === 0 || isBulkTodayUpdating) {
			return;
		}

		setIsBulkTodayUpdating(true);
		const targetCompleted = !areAllTodayCompleted;

		try {
			const responses = await Promise.all(
				completableTodayGoals.map((stats) =>
					markRegularProgress({
						regular_goal_id: stats.regularGoal,
						completed: targetCompleted,
						notes: '',
					})
				)
			);

			if (targetCompleted) {
				markAllItems(completableTodayGoals, buildCompletedSnapshot);
			} else {
				unmarkAllItems(completableTodayGoals);
			}

			responses.forEach((response, index) => {
				const stats = completableTodayGoals[index];
				const updatedStats = extractMarkProgressStatistics(response.data);
				const snapshot = updatedStats ?? (targetCompleted ? buildCompletedSnapshot(stats) : stats);

				if (updatedStats) {
					mergeStatisticsUpdate(updatedStats);
				}

				if (targetCompleted) {
					applyMarkedItem(stats, snapshot);
				} else {
					applyUnmarkedItem(snapshot);
				}
			});

			loadRegularGoalStatistics({silent: true}).catch(() => {});
			await getUser();
			HeaderRegularGoalsStore.loadTodayCount();

			NotificationStore.addNotification({
				type: 'success',
				title: 'Успешно!',
				message: targetCompleted ? 'Все цели на сегодня отмечены' : 'Отметка о выполнении снята со всех целей',
			});
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось обновить цели на сегодня',
			});
		} finally {
			setIsBulkTodayUpdating(false);
		}
	};

	const isInitialLoading = isLoading && statisticsData.length === 0;

	if (!isLoading && statisticsData.length === 0) {
		return (
			<div className={block()}>
				<Title tag="h2" className={element('title')}>
					Регулярные цели
				</Title>
				<EmptyState
					title="У вас пока нет регулярных целей"
					description="Создайте цель и настройте для неё регулярность выполнения!"
				/>
			</div>
		);
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Регулярные цели
				</Title>
				{!showSlotSelection && regularGoalsLimitReached && (
					<Button
						theme="blue"
						icon="rocket"
						onClick={() => {
							if (isPremium) {
								setIsPremiumLimitModalOpen(true);
								return;
							}
							navigate('/user/self/subs');
						}}
						size="small"
					>
						{isPremium ? 'Нужно больше?' : 'Больше с Premium'}
					</Button>
				)}
			</div>

			{selectionPending && (
				<Banner
					type="warning"
					className={element('banner')}
					message={selectionPendingBannerMessage}
					actionText="Оформить Premium"
					onAction={() => navigate('/user/self/subs')}
				/>
			)}

			{canChangeSlots && (
				<Banner
					type="info"
					className={element('banner')}
					message={slotsChangeBannerMessage}
					actionText="Выбрать цели"
					onAction={() => setIsChangingSlots(true)}
				/>
			)}

			{slotsLocked && hasPausedGoals && !isPremium && !selectionPending && (
				<Banner
					type="info"
					className={element('banner')}
					message="Вы отметили выполнение всех активных целей. Набор зафиксирован до подключения Premium."
					actionText="Оформить Premium"
					onAction={() => navigate('/user/self/subs')}
				/>
			)}

			{isChangingSlots && !selectionPending && (
				<Banner
					type="info"
					className={element('banner')}
					message={
						lockedSlotIds.length > 0
							? `Выберите до ${maxRegularGoals} регулярных целей. ${lockedSlotIds.length} уже отмечены выполнением и не могут быть сняты.`
							: `Выберите до ${maxRegularGoals} регулярных целей, которые останутся активными.`
					}
				/>
			)}

			<div className={element('content')}>
				{showSlotSelection ? (
					renderSlotSelection()
				) : (
					<>
						<div className="catalog-items__filters">
							<Switch className="catalog-items__switch" buttons={buttonsSwitch} active={activeTab} />
							<Line className="catalog-items__line" />
							{activeTab === 'today' ? (
								<div className={element('bulk-today-wrapper')}>
									<Button
										theme="blue-light"
										size="medium"
										icon={areAllTodayCompleted ? 'regular' : 'regular-empty'}
										hoverIcon={areAllTodayCompleted ? 'cross' : undefined}
										onClick={handleToggleCompleteAllToday}
										disabled={isBulkTodayUpdating || completableTodayGoals.length === 0}
										hoverContent={areAllTodayCompleted ? 'Снять выполнение всех' : undefined}
									>
										{areAllTodayCompleted ? 'Выполнено все сегодня' : 'Выполнить все сегодня'}
									</Button>
								</div>
							) : (
								<div className="catalog-items__search-wrapper catalog-items__search-wrapper--wrap-on-lg">
									<FieldInput
										className="catalog-items__search"
										placeholder="Поиск по названию цели"
										id="user-self-regular-search"
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
											totalCount={allGoals.length}
										/>
										<Select options={SORT_OPTIONS} activeOption={activeSort} onSelect={handleSortSelect} filter />
									</div>
								</div>
							)}
						</div>
						{isInitialLoading ? (
							<CatalogItemsSkeleton columns="3" />
						) : (
							<div id="user-self-regular-goals">
								{activeTab === 'today'
									? renderGoalsList(
											todayGoalsToRender,
											areAllTodayCompleted ? 'Все цели на сегодня выполнены!' : 'На сегодня нет регулярных целей',
											areAllTodayCompleted
												? 'Отличная работа! Возвращайтесь завтра, чтобы продолжить серию.'
												: 'Отметьте регулярные цели, которые хотите выполнить сегодня.'
									  )
									: renderGoalsList(
											allGoals,
											'Нет регулярных целей',
											'Добавьте регулярные цели из каталога, чтобы отслеживать привычки и прогресс.'
									  )}
							</div>
						)}
					</>
				)}
			</div>
			<RegularGoalsPremiumLimitModal isOpen={isPremiumLimitModalOpen} onClose={() => setIsPremiumLimitModalOpen(false)} />
		</div>
	);
});
