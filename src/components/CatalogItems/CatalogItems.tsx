import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo, useState} from 'react';
import {scroller} from 'react-scroll';

import {RegularGoalSettingsModal} from '@/components/RegularGoalSettingsModal/RegularGoalSettingsModal';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {CategoriesStore} from '@/store/CategoriesStore';
import {HeaderRegularGoalsStore} from '@/store/HeaderRegularGoalsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {ICategoryDetailed, ICategoryWithSubcategories, IGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import {IPaginationPage} from '@/typings/request';
import {getAllGoals} from '@/utils/api/get/getAllGoals';
import {getAllLists} from '@/utils/api/get/getAllLists';
import {getRegularGoals} from '@/utils/api/get/getRegularGoals';
import {getRegularGoalSettings} from '@/utils/api/get/getRegularGoalSettings';
import {getUsualGoals} from '@/utils/api/get/getUsualGoals';
import {addGoal} from '@/utils/api/post/addGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {addRegularGoalToUser, RegularGoalSettings} from '@/utils/api/post/addRegularGoalToUser';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';
import {defaultPagination} from '@/utils/data/default';

import {CatalogItemsSkeleton} from './CatalogItemsSkeleton';
import {Card} from '../Card/Card';
import {EmptyState} from '../EmptyState/EmptyState';
import {FieldInput} from '../FieldInput/FieldInput';
import {FiltersDrawer, FilterGroup} from '../FiltersDrawer/FiltersDrawer';
import {Line} from '../Line/Line';
import {Pagination} from '../Pagination/Pagination';
import Select, {OptionSelect} from '../Select/Select';
import {Switch} from '../Switch/Switch';

import './catalog-items.scss';

interface CatalogItemsProps {
	className?: string;
	subPage?: string;
	beginUrl: string;
	columns?: string;
	initialSearch?: string;
	searchWrapperWrap?: boolean;
	onSearchChange?: (query: string) => void;
	/** Личный кабинет: раздел «На рассмотрении» (неодобренные для каталога) */
	pendingCatalogReview?: boolean;
	/** Если передан — родитель берёт на себя показ лоадера начальной загрузки. */
	onInitialLoadingChange?: (loading: boolean) => void;
}

interface CatalogItemsCategoriesProps extends CatalogItemsProps {
	code: string;
	category: ICategoryWithSubcategories | null;
	userId?: never;
	completed?: never;
	categories: Array<ICategoryDetailed>;
}

interface CatalogItemsUsersProps extends CatalogItemsProps {
	userId: string;
	code?: never;
	category?: never;
	completed: boolean;
	categories?: Array<ICategoryDetailed>;
}

/** Варианты сортировки зависят от контекста: каталог / активные / выполненные, цели / списки */
function getSortOptions(isUser: boolean, isCompleted: boolean, page?: string): Array<OptionSelect> {
	if (!isUser) {
		return [
			{name: 'Новые', value: '-created_at'},
			{name: 'Популярные', value: '-added_by_users'},
			{name: 'Обсуждаемые', value: '-comments_count'},
			{name: 'Легкие', value: 'complexity'},
			{name: 'Сложные', value: '-complexity'},
		];
	}

	if (isCompleted) {
		if (page === 'lists') {
			return [
				{name: 'Новые', value: '-completed_at'},
				{name: 'Старые', value: 'completed_at'},
				{name: 'Легкие', value: 'complexity'},
				{name: 'Сложные', value: '-complexity'},
				{name: 'По кол-ву целей', value: '-goals_count'},
			];
		}
		return [
			{name: 'Новые', value: '-completed_at'},
			{name: 'Старые', value: 'completed_at'},
			{name: 'Легкие', value: 'complexity'},
			{name: 'Сложные', value: '-complexity'},
		];
	}

	// Активные
	if (page === 'lists') {
		return [
			{name: 'Новые', value: '-added_at'},
			{name: 'Старые', value: 'added_at'},
			{name: 'Легкие', value: 'complexity'},
			{name: 'Сложные', value: '-complexity'},
			{name: 'По кол-ву целей', value: '-goals_count'},
			{name: 'По выполненным', value: '-completed_goals_count'},
		];
	}
	return [
		{name: 'Новые', value: '-added_at'},
		{name: 'Старые', value: 'added_at'},
		{name: 'Обсуждаемые', value: '-comments_count'},
		{name: 'Легкие', value: 'complexity'},
		{name: 'Сложные', value: '-complexity'},
	];
}

const CatalogItemsComponent: FC<CatalogItemsCategoriesProps | CatalogItemsUsersProps> = (props) => {
	const {
		className,
		code = 'all',
		subPage,
		category,
		userId,
		completed,
		beginUrl,
		columns,
		categories,
		initialSearch = '',
		searchWrapperWrap = false,
		onSearchChange,
		pendingCatalogReview = false,
		onInitialLoadingChange,
	} = props;

	const {isAuth} = UserStore;
	const [block, element] = useBem('catalog-items', className);

	const [goals, setGoals] = useState<{
		data: Array<IGoal>;
		pagination: IPaginationPage;
	}>({data: [], pagination: defaultPagination});
	const [lists, setLists] = useState<{
		data: Array<IList>;
		pagination: IPaginationPage;
	}>({data: [], pagination: defaultPagination});
	const [activeSort, setActiveSort] = useState(0);
	const [search, setSearch] = useState(initialSearch);
	const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
	const [get, setGet] = useState(userId ? {user_id: userId, completed} : {});
	const [filterValues, setFilterValues] = useState<Record<string, string[]>>({
		categories: [],
		goalType: [],
		complexity: [],
		hundredGoals: [],
		goalDisplaying: [],
	});
	const [loading, setLoading] = useState(false);
	const [searchLoading, setSearchLoading] = useState(false);
	const [goalsLoaded, setGoalsLoaded] = useState(false);
	const [listsLoaded, setListsLoaded] = useState(false);
	const {isScreenSmallMobile} = useScreenSize();
	// Состояния для модалки регулярных целей
	const [showRegularModal, setShowRegularModal] = useState(false);
	const [regularGoalData, setRegularGoalData] = useState<any>(null);
	const [pendingGoalIndex, setPendingGoalIndex] = useState<number | null>(null);
	const [isRegularLoading, setIsRegularLoading] = useState(false);

	const sortOptions = useMemo(() => getSortOptions(!!userId, !!completed, subPage), [userId, completed, subPage]);

	// Активен ли сейчас режим поиска
	const isSearchMode = search.trim().length >= 3;

	const userListQueryBase = userId
		? {
				user_id: userId,
				completed,
				...(pendingCatalogReview ? {pending_catalog_review: true as const} : {}),
		  }
		: {};

	const buttonsSwitch = useMemo(() => {
		let url = '';
		if (category) {
			url = category.category.parentCategory
				? `${category.category.parentCategory.nameEn}/${category.category.nameEn}`
				: category.category.nameEn;
		}
		return [
			{
				url: `${beginUrl}${url}`,
				name: 'Цели',
				page: 'goals',
				count: goals.pagination.totalItems,
			},
			{
				url: `${beginUrl}${url}/lists`,
				name: 'Списки',
				page: 'lists',
				count: lists.pagination.totalItems,
			},
		];
	}, [goals, lists, category, beginUrl]);

	// Преобразуем категории в формат для FiltersDrawer (с подкатегориями)
	const categoryFilters = useMemo(() => {
		const tree = CategoriesStore.categoriesTree;
		if (tree.length > 0) {
			return tree.map((cat) => ({
				name: cat.name,
				code: cat.nameEn,
				children: cat.children?.length
					? cat.children.map((sub) => ({
							name: sub.name,
							code: sub.nameEn,
					  }))
					: undefined,
			}));
		}
		// Fallback на плоский список из пропсов
		if (!categories) return [];
		return categories.map((cat: ICategoryDetailed) => ({
			name: cat.name,
			code: cat.nameEn,
		}));
	}, [categories, CategoriesStore.categoriesTree]);

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

		if (!pendingCatalogReview) {
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
		}

		if (code === 'all' && !userId && !pendingCatalogReview) {
			groups.push({
				key: 'goalDisplaying',
				label: 'Показ целей',
				options: [
					{name: 'Исключить добавленные', code: 'added'},
					{name: 'Исключить выполненные', code: 'completed'},
				],
				allLabel: 'Все цели',
			});
		}

		if (subPage === 'goals' && !pendingCatalogReview) {
			groups.push({
				key: 'hundredGoals',
				label: '100 целей',
				options: [
					{name: 'Только из 100 целей', code: 'only'},
					{name: 'Исключить 100 целей', code: 'exclude'},
				],
				allLabel: 'Все цели',
			});

			groups.push({
				key: 'goalType',
				label: 'Тип цели',
				options: [
					{name: 'Регулярные', code: 'regular'},
					{name: 'Обычные', code: 'usual'},
				],
				allLabel: 'Все цели',
			});
		}

		return groups;
	}, [categoryFilters, subPage, pendingCatalogReview, code, userId]);

	useEffect(() => {
		setGoalsLoaded(false);
		(async () => {
			const tempGet = {...userListQueryBase};
			setGet(tempGet);

			// Добавляем поисковый запрос, если он есть
			const searchParams = initialSearch ? {search: initialSearch} : {};

			const res = await getAllGoals(code, {...tempGet, sort_by: sortOptions[0].value, ...searchParams});
			if (res.success) {
				setGoals(res.data);
			}
			setGoalsLoaded(true);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subPage, code, completed, userId, initialSearch, pendingCatalogReview, isAuth]);

	useEffect(() => {
		setListsLoaded(false);
		(async () => {
			const tempGet = {...userListQueryBase};
			setGet(tempGet);

			// Добавляем поисковый запрос, если он есть
			const searchParams = initialSearch ? {search: initialSearch} : {};

			const res = await getAllLists(code, {...tempGet, sort_by: sortOptions[0].value, ...searchParams});
			if (res.success) {
				setLists(res.data);
			}
			setListsLoaded(true);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subPage, code, completed, userId, initialSearch, pendingCatalogReview, isAuth]);

	useEffect(() => {
		setActiveSort(0);
		setFilterValues({categories: [], goalType: [], complexity: [], hundredGoals: [], goalDisplaying: []});
	}, [subPage]);

	// Синхронизируем поиск с URL при смене страницы/контекста (без смены вкладки)
	useEffect(() => {
		setSearch(initialSearch);
	}, [initialSearch, beginUrl]);

	// Сообщаем родителю о состоянии начальной загрузки, чтобы он мог показать единый лоадер
	useEffect(() => {
		if (!onInitialLoadingChange) return;
		const initialLoading = (subPage === 'goals' && !goalsLoaded) || (subPage === 'lists' && !listsLoaded);
		onInitialLoadingChange(initialLoading);
	}, [goalsLoaded, listsLoaded, subPage, onInitialLoadingChange]);

	const fetchData = async (sortValue: string, page?: number, filtersOverride?: Record<string, string[]>): Promise<boolean> => {
		setLoading(true);
		try {
			let res;
			const currentFilters = filtersOverride ?? filterValues;
			const goalTypeValue = currentFilters['goalType']?.[0] || 'all';
			const categoriesSort = currentFilters['categories'] || [];
			const goalDisplaying = currentFilters['goalDisplaying'] || [];
			const queryParams = {
				...get,
				sort_by: sortValue,
				page,
				...(search.trim().length >= 2 ? {search: search.trim()} : {}),
				...(categoriesSort.length > 0 ? {categories: categoriesSort.join(',')} : {}),
				...(currentFilters['complexity']?.length > 0 ? {complexity: currentFilters['complexity'][0]} : {}),
				...(currentFilters['hundredGoals']?.length > 0 ? {hundred_goals: currentFilters['hundredGoals'][0]} : {}),
				...(goalDisplaying.includes('added') ? {exclude_added: true} : {}),
				...(goalDisplaying.includes('completed') ? {exclude_completed: true} : {}),
			};

			if (subPage === 'goals') {
				if (pendingCatalogReview && userId) {
					res = await getAllGoals(code, queryParams);
				} else if (goalTypeValue === 'regular') {
					res = await getRegularGoals(code, queryParams);
				} else if (goalTypeValue === 'usual') {
					res = await getUsualGoals(code, queryParams);
				} else {
					res = await getAllGoals(code, queryParams);
				}
			} else {
				res = await getAllLists(code, queryParams);
			}

			if (res.success) {
				if (subPage === 'goals') {
					setGoals(res.data);
				} else {
					setLists(res.data);
				}
				return true;
			}
			return false;
		} catch (error) {
			return false;
		} finally {
			setLoading(false);
		}
	};

	const onSelect = async (active: number): Promise<void> => {
		setActiveSort(active);
		await fetchData(sortOptions[active].value, undefined, filterValues);
	};

	const handleFilterChange = (key: string, selected: string[]) => {
		setFilterValues((prev) => {
			const newFilters = {...prev, [key]: selected};
			fetchData(sortOptions[activeSort].value, undefined, newFilters);
			return newFilters;
		});
	};

	const handleFilterReset = () => {
		const emptyFilters = {categories: [], goalType: [], complexity: [], hundredGoals: [], goalDisplaying: []};
		setFilterValues(emptyFilters);
		fetchData(sortOptions[activeSort].value, undefined, emptyFilters);
	};

	const goToPage = async (active: number): Promise<boolean> => {
		const success = await fetchData(sortOptions[activeSort].value, active, filterValues);
		scroller.scrollTo('catalog-items-goals', {
			duration: 800,
			delay: 0,
			smooth: 'easeInOutQuart',
			offset: -150,
		});
		return success;
	};

	const onSearch = (query: string) => {
		setSearch(query);
		onSearchChange?.(query);
		// Устанавливаем задержку в 300 миллисекунд
		const delay = 300;
		// Если есть предыдущий таймер, сбрасываем его
		if (timer) {
			clearTimeout(timer);
		}
		// Устанавливаем новый таймер
		setTimer(
			setTimeout(async () => {
				setSearchLoading(true);
				try {
					// Выполняем поиск только если длина запроса больше или равна 3
					if (subPage === 'goals') {
						if (query.length >= 3) {
							const res = await getAllGoals(code, {
								...userListQueryBase,
								sort_by: sortOptions[activeSort].value,
								search: query,
								...(filterValues['categories'].length > 0 ? {categories: filterValues['categories'].join(',')} : {}),
							});
							if (res.success) {
								setGoals(res.data);
							}
						} else {
							// Если длина запроса меньше 3, делаем запрос с пустым значением
							const res = await getAllGoals(code, {
								...userListQueryBase,
								sort_by: sortOptions[activeSort].value,
								search: '',
								...(filterValues['categories'].length > 0 ? {categories: filterValues['categories'].join(',')} : {}),
							});
							if (res.success) {
								setGoals(res.data);
							}
						}
					} else if (query.length >= 3) {
						const res = await getAllLists(code, {
							...userListQueryBase,
							sort_by: sortOptions[activeSort].value,
							search: query,
							...(filterValues['categories'].length > 0 ? {categories: filterValues['categories'].join(',')} : {}),
						});
						if (res.success) {
							setLists(res.data);
						}
					} else {
						// Если длина запроса меньше 3, делаем запрос с пустым значением
						const res = await getAllLists(code, {
							...userListQueryBase,
							sort_by: sortOptions[activeSort].value,
							search: '',
							...(filterValues['categories'].length > 0 ? {categories: filterValues['categories'].join(',')} : {}),
						});
						if (res.success) {
							setLists(res.data);
						}
					}
				} finally {
					setSearchLoading(false);
				}
			}, delay)
		);
	};

	const updateGoal = async (codeGoal: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
		// Специальная обработка для добавления цели - проверяем на регулярность
		if (operation === 'add') {
			try {
				// Проверяем, является ли цель регулярной
				const regularSettings = await getRegularGoalSettings(codeGoal);

				if (regularSettings.success && regularSettings.data) {
					// Если настройки можно изменить, показываем модалку
					if (regularSettings.data.regular_settings?.allowCustomSettings) {
						setRegularGoalData(regularSettings.data);
						setPendingGoalIndex(i); // Запоминаем индекс цели для последующего обновления
						setShowRegularModal(true);
						return; // Выходим из функции, добавление будет происходить в модалке
					}
					// Если настройки нельзя изменить, используем обычный endpoint /add/ с базовыми настройками
					const response = await addGoal(codeGoal);

					if (response.success) {
						const updatedGoal = {
							...goals.data[i],
							addedByUser: true,
							totalAdded: (goals.data[i].totalAdded || 0) + 1,
						};
						const newGoals = [...goals.data];
						newGoals[i] = updatedGoal;
						setGoals({...goals, data: newGoals});
						HeaderRegularGoalsStore.loadTodayCount();
						NotificationStore.addNotification({
							type: 'success',
							title: 'Успех',
							message: 'Регулярная цель успешно добавлена!',
						});
						return;
					}
				}
			} catch (error) {
				// Если API регулярности не отвечает или цель не регулярная, продолжаем обычное добавление
				console.log('Цель не является регулярной или ошибка API');
			}
		}

		const res = await (operation === 'add'
			? addGoal(codeGoal)
			: operation === 'delete'
			? removeGoal(codeGoal)
			: markGoal(codeGoal, !done));

		if (res.success && goals) {
			const updatedGoal = {
				...goals.data[i],
				addedByUser: operation !== 'delete',
				completedByUser: operation === 'mark' ? !done : operation === 'delete' ? false : goals.data[i].completedByUser,
				totalAdded: res.data.users_added_count,
			};

			const newGoals = [...goals.data];
			newGoals[i] = updatedGoal;

			setGoals({...goals, data: newGoals});

			// Обновляем счётчик регулярных целей при добавлении/удалении
			if (operation === 'add' || operation === 'delete') {
				HeaderRegularGoalsStore.loadTodayCount();
			}
		}
	};

	const updateList = async (codeList: string, i: number, operation: 'add' | 'delete'): Promise<void> => {
		const res = await (operation === 'add' ? addListGoal(codeList) : removeListGoal(codeList));

		if (res.success) {
			const updatedList = {
				...lists.data[i],
				addedByUser: operation === 'add',
				totalAdded: res.data.users_added_count,
			};

			const newLists = [...lists.data];
			newLists[i] = updatedList;

			setLists({...lists, data: newLists});
		}
	};

	// Обработчики для модалки регулярных целей
	const handleRegularModalClose = () => {
		setShowRegularModal(false);
		setRegularGoalData(null);
		setPendingGoalIndex(null);
	};

	const handleRegularGoalSave = async (settings: RegularGoalSettings) => {
		if (!regularGoalData?.goal || pendingGoalIndex === null) return;

		setIsRegularLoading(true);
		try {
			// Явно передаем все поля, включая customSchedule
			const requestData: RegularGoalSettings = {
				frequency: settings.frequency,
				durationType: settings.durationType,
				allowSkipDays: settings.allowSkipDays,
				resetOnSkip: settings.resetOnSkip,
				...(settings.frequency === 'weekly' && settings.weeklyFrequency !== undefined
					? {weeklyFrequency: settings.weeklyFrequency}
					: {}),
				...(settings.frequency === 'custom' && settings.customSchedule !== undefined
					? {customSchedule: settings.customSchedule}
					: {}),
				...(settings.durationType === 'days' || settings.durationType === 'weeks'
					? settings.durationValue !== undefined
						? {durationValue: settings.durationValue}
						: {}
					: {}),
				...(settings.durationType === 'until_date' && settings.endDate !== undefined ? {endDate: settings.endDate} : {}),
			};

			const response = await addRegularGoalToUser(regularGoalData.goal.code, requestData);

			if (response.success) {
				// Обновляем состояние цели как добавленной
				const updatedGoal = {
					...goals.data[pendingGoalIndex],
					addedByUser: true,
					totalAdded: (goals.data[pendingGoalIndex].totalAdded || 0) + 1,
				};

				const newGoals = [...goals.data];
				newGoals[pendingGoalIndex] = updatedGoal;
				setGoals({...goals, data: newGoals});
				HeaderRegularGoalsStore.loadTodayCount();

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успех',
					message: 'Регулярная цель успешно добавлена с вашими настройками!',
				});

				setShowRegularModal(false);
				setRegularGoalData(null);
				setPendingGoalIndex(null);
			} else {
				throw new Error(response.error || 'Ошибка при добавлении регулярной цели');
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось добавить регулярную цель',
			});
		} finally {
			setIsRegularLoading(false);
		}
	};

	const isInitialLoading = (subPage === 'goals' && !goalsLoaded) || (subPage === 'lists' && !listsLoaded);

	return (
		<section className={block()} key={code}>
			<div className={element('filters')}>
				<div className={element('filters-wrapper')}>
					<Switch className={element('switch')} buttons={buttonsSwitch} active={subPage || ''} />
				</div>
				<Line className={element('line')} />
				<div className={element('search-wrapper', {'wrap-on-lg': searchWrapperWrap})}>
					<FieldInput
						className={element('search')}
						placeholder="Поисковой запрос"
						id="searching"
						value={search}
						setValue={onSearch}
						iconBegin="search"
						iconEnd={search.trim() ? 'cross' : undefined}
						iconEndClick={search.trim() ? () => onSearch('') : undefined}
					/>
					<div className={element('categories-wrapper')}>
						<FiltersDrawer
							filters={drawerFilters}
							values={filterValues}
							onChange={handleFilterChange}
							onReset={handleFilterReset}
							totalCount={subPage === 'goals' ? goals.pagination.totalItems : lists.pagination.totalItems}
						/>
						<Select options={sortOptions} activeOption={activeSort} onSelect={onSelect} filter />
					</div>
				</div>
			</div>
			{isInitialLoading || loading || searchLoading ? (
				<CatalogItemsSkeleton isList={subPage === 'lists'} columns={columns as '3' | '4'} />
			) : (
				<>
					{subPage === 'goals' ? (
						!goalsLoaded ? null : goals.data.length === 0 ? (
							<EmptyState
								title={
									isSearchMode
										? 'По запросу ничего не найдено'
										: pendingCatalogReview
										? 'Нет целей на рассмотрении'
										: completed
										? 'У вас пока нет выполненных целей'
										: 'У вас пока нет активных целей'
								}
								description={
									isSearchMode
										? 'Попробуйте изменить параметры поиска'
										: pendingCatalogReview
										? 'Созданные вами цели и списки появятся здесь до публикации в общий каталог. Выполненные — в разделе «Выполненные».'
										: completed
										? 'Начните выполнять цели, чтобы они появились в списке выполненных'
										: 'Добавьте цели из каталога, чтобы они появились в списке активных'
								}
							/>
						) : (
							<section className={element('goals', {columns})} id="catalog-items-goals">
								{goals.data.map((goal, i) => (
									<Card
										className={element('goal')}
										goal={goal}
										key={goal.code}
										onClickAdd={() => updateGoal(goal.code, i, 'add')}
										onClickDelete={() => updateGoal(goal.code, i, 'delete')}
										onClickMark={() => updateGoal(goal.code, i, 'mark', goal.completedByUser)}
									/>
								))}
							</section>
						)
					) : !listsLoaded ? null : lists.data.length === 0 ? (
						<EmptyState
							title={
								isSearchMode
									? 'По запросу ничего не найдено'
									: pendingCatalogReview
									? 'Нет списков на рассмотрении'
									: completed
									? 'У вас пока нет выполненных списков'
									: 'У вас пока нет активных списков'
							}
							description={
								isSearchMode
									? 'Попробуйте изменить параметры поиска'
									: pendingCatalogReview
									? 'После одобрения модератором список появится в общем каталоге. Выполненные — в разделе «Выполненные».'
									: completed
									? 'Начните выполнять списки целей, чтобы они появились в списке выполненных'
									: 'Добавьте списки из каталога, чтобы они появились в списке активных'
							}
						/>
					) : (
						<section className={element('goals', {columns})} id="catalog-items-lists">
							{lists.data.map((goal, i) => (
								<Card
									className={element('list')}
									goal={goal}
									key={goal.code}
									horizontal={!isScreenSmallMobile}
									isList
									onClickAdd={() => updateList(goal.code, i, 'add')}
									onClickDelete={() => updateList(goal.code, i, 'delete')}
								/>
							))}
						</section>
					)}
					{subPage === 'lists' && lists.data.length > 0 && (
						<Pagination currentPage={lists.pagination.page} totalPages={lists.pagination.totalPages} goToPage={goToPage} />
					)}
					{subPage === 'goals' && goals.data.length > 0 && (
						<Pagination currentPage={goals.pagination.page} totalPages={goals.pagination.totalPages} goToPage={goToPage} />
					)}
				</>
			)}

			{/* Модалка настройки регулярности */}
			{showRegularModal && regularGoalData?.regular_settings && (
				<RegularGoalSettingsModal
					isOpen={showRegularModal}
					onClose={handleRegularModalClose}
					goalData={regularGoalData.goal}
					originalSettings={regularGoalData.regular_settings}
					onSave={handleRegularGoalSave}
					isLoading={isRegularLoading}
				/>
			)}
		</section>
	);
};

export const CatalogItems = observer(CatalogItemsComponent);
