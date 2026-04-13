import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {scroller} from 'react-scroll';

import {Button} from '@/components/Button/Button';
import {RegularCard} from '@/components/Card/RegularCard';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {FiltersDrawer, FilterGroup} from '@/components/FiltersDrawer/FiltersDrawer';
import {Line} from '@/components/Line/Line';
import {BlurLoader} from '@/components/Loader/BlurLoader';
import {Loader} from '@/components/Loader/Loader';
import {Pagination} from '@/components/Pagination/Pagination';
import Select, {OptionSelect} from '@/components/Select/Select';
import {Switch} from '@/components/Switch/Switch';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {IPaginationPage} from '@/typings/request';
import {getUser} from '@/utils/api/get/getUser';
import {getGoalsInProgress, IGoalProgress, updateGoalProgress} from '@/utils/api/goals';

import '@/components/CatalogItems/catalog-items.scss';
import './user-self-progress.scss';

const SORT_OPTIONS: OptionSelect[] = [
	{name: 'По прогрессу (убыв.)', value: 'progress_desc'},
	{name: 'По прогрессу (возр.)', value: 'progress_asc'},
	{name: 'По названию', value: 'title_asc'},
	{name: 'По дате обновления', value: 'last_updated_desc'},
];

export const UserSelfProgress: FC = observer(() => {
	const [block, element] = useBem('user-self-progress');
	const location = useLocation();
	const activeTab = (location.hash === '#all' ? 'all' : 'today') as 'today' | 'all';

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

	const categoryFilters = useMemo(() => {
		const map = new Map<string, string>();
		goals.forEach((g) => {
			if (g.goalCategory && !map.has(g.goalCategory)) map.set(g.goalCategory, g.goalCategory);
		});
		return Array.from(map.values()).map((name) => ({name, code: name}));
	}, [goals]);

	const filteredGoals = useMemo(() => {
		let result = [...goals];
		if (activeTab === 'today') {
			result = result.filter((g) => !g.isWorkingToday);
		}
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter((g) => g.goalTitle.toLowerCase().includes(q));
		}
		if (filterValues['categories'].length > 0) {
			result = result.filter((g) => filterValues['categories'].includes(g.goalCategory));
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
	}, [goals, activeTab, search, filterValues, activeSort]);

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

	const loadGoalsInProgress = async (page = 1) => {
		setIsLoading(page === 1);
		setIsPageLoading(page > 1);
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
					// Если нет пагинации, считаем на клиенте
					setTodayCount(data.filter((g) => !g.isWorkingToday).length);
				} else {
					setGoals(data.data);
					setPagination(data.pagination);
					setCurrentPage(data.pagination.page);
					// Используем todayCount из ответа сервера, если есть
					if (data.todayCount !== undefined) {
						setTodayCount(data.todayCount);
					} else {
						// Fallback: считаем на клиенте из текущей страницы
						setTodayCount(data.data.filter((g) => !g.isWorkingToday).length);
					}
				}
			}
		} catch (error) {
			console.error('Ошибка загрузки целей в процессе:', error);
		} finally {
			setIsLoading(false);
			setIsPageLoading(false);
		}
	};

	const refreshProgressAndProfile = async (page: number) => {
		await loadGoalsInProgress(page);
		await getUser();
	};

	useEffect(() => {
		loadGoalsInProgress();
	}, []);

	// На вкладке «На сегодня» поиск и категории скрыты — сбрасываем, чтобы не фильтровать «вслепую»
	useEffect(() => {
		if (activeTab === 'today') {
			setSearch('');
			setFilterValues({categories: [], complexity: []});
		}
	}, [activeTab]);

	const openProgressModal = (goal: IGoalProgress) => {
		const pageAtOpen = currentPage;
		setWindow('progress-update');
		setIsOpen(true);
		setModalProps({
			goalId: goal.goal,
			goalTitle: goal.goalTitle,
			currentProgress: goal,
			// При 100% модалка вызывает onGoalCompleted и затем onProgressUpdate — обновляем один раз здесь
			onProgressUpdate: async () => {
				await refreshProgressAndProfile(pageAtOpen);
			},
		});
	};

	const markToday = async (goal: IGoalProgress) => {
		try {
			const updateResponse = await updateGoalProgress(goal.goal, {
				progress_percentage: goal.progressPercentage,
				daily_notes: goal.dailyNotes || '',
				is_working_today: !goal.isWorkingToday,
			});

			if (updateResponse.success && updateResponse.data) {
				await refreshProgressAndProfile(currentPage);
			}
		} catch (error) {
			console.error('Ошибка отметки «работаю сегодня»:', error);
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
		} catch (error) {
			console.error('Ошибка отметки цели как выполненной:', error);
		}
	};

	/** На текущей странице: без отметки «сегодня» / с отметкой (для массовых действий) */
	const pendingTodayOnPage = goals.filter((g) => !g.isWorkingToday);
	const markedTodayOnPage = goals.filter((g) => g.isWorkingToday);
	const allMarkedOnPage = goals.length > 0 && pendingTodayOnPage.length === 0;

	const handleToggleCompleteAllToday = async () => {
		if (activeTab !== 'today' || isBulkTodayUpdating || goals.length === 0) {
			return;
		}

		setIsBulkTodayUpdating(true);

		try {
			if (pendingTodayOnPage.length > 0) {
				await Promise.all(
					pendingTodayOnPage.map((goal) =>
						updateGoalProgress(goal.goal, {
							progress_percentage: goal.progressPercentage,
							daily_notes: goal.dailyNotes || '',
							is_working_today: true,
						})
					)
				);
			} else if (markedTodayOnPage.length > 0) {
				await Promise.all(
					markedTodayOnPage.map((goal) =>
						updateGoalProgress(goal.goal, {
							progress_percentage: goal.progressPercentage,
							daily_notes: goal.dailyNotes || '',
							is_working_today: false,
						})
					)
				);
			}

			await refreshProgressAndProfile(currentPage);
		} catch (error) {
			console.error('Ошибка массового обновления целей «работаю сегодня»:', error);
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

	if (isLoading && goals.length === 0) {
		return <Loader isLoading isPageLoader />;
	}

	const buttonsSwitch = [
		{url: '#today', name: 'На сегодня', page: 'today' as const, count: todayCount},
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
								disabled={isBulkTodayUpdating || goals.length === 0}
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
									totalCount={filteredGoals.length}
								/>
								<Select options={SORT_OPTIONS} activeOption={activeSort} onSelect={handleSortSelect} filter />
							</div>
						</div>
					)}
				</div>

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
					) : filteredGoals.length === 0 ? (
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
							{filteredGoals.map((goal) => (
								<RegularCard
									key={goal.id}
									variant="progress"
									progressGoal={goal}
									onOpenProgressModal={() => openProgressModal(goal)}
									onMarkToday={() => markToday(goal)}
									onMarkCompleted={() => markGoalCompleted(goal)}
									className="catalog-items__goal catalog-items__goal--full"
								/>
							))}
						</div>
					)}
				</BlurLoader>

				{pagination && pagination.totalPages > 1 && (
					<Pagination currentPage={currentPage} totalPages={pagination.totalPages} goToPage={goToPage} />
				)}
			</div>
		</section>
	);
});
