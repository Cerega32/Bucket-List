import {FC, useEffect, useMemo, useState} from 'react';
import {scroller} from 'react-scroll';

import {RegularGoalSettingsModal} from '@/components/RegularGoalSettingsModal/RegularGoalSettingsModal';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {ICategoryDetailed, ICategoryWithSubcategories, IGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import {IPaginationPage} from '@/typings/request';
import {getAllGoals} from '@/utils/api/get/getAllGoals';
import {getAllLists} from '@/utils/api/get/getAllLists';
import {getRegularGoalSettings} from '@/utils/api/get/getRegularGoalSettings';
import {addGoal} from '@/utils/api/post/addGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {addRegularGoalToUser} from '@/utils/api/post/addRegularGoalToUser';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';
import {defaultPagination} from '@/utils/data/default';

import {Card} from '../Card/Card';
import {EmptyState} from '../EmptyState/EmptyState';
import {FieldInput} from '../FieldInput/FieldInput';
import {FiltersCheckbox} from '../FiltersCheckbox/FiltersCheckbox';
import {Loader} from '../Loader/Loader';
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

const sortBy: Array<OptionSelect> = [
	{
		name: 'Новые',
		value: '-created_at',
	},
	{
		name: 'Старые',
		value: 'created_at',
	},
	{
		name: 'Cамые популярные',
		value: '-added_by_users',
	},
	{
		name: 'Больше всего выполненные',
		value: '-completed_by_users',
	},
];

export const CatalogItems: FC<CatalogItemsCategoriesProps | CatalogItemsUsersProps> = (props) => {
	const {className, code = 'all', subPage, category, userId, completed, beginUrl, columns, categories, initialSearch = ''} = props;

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
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	// Состояния для модалки регулярных целей
	const [showRegularModal, setShowRegularModal] = useState(false);
	const [regularGoalData, setRegularGoalData] = useState<any>(null);
	const [pendingGoalIndex, setPendingGoalIndex] = useState<number | null>(null);
	const [isRegularLoading, setIsRegularLoading] = useState(false);

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

	// Преобразуем категории в формат для FiltersCheckbox
	const categoryFilters = useMemo(() => {
		if (!categories) return [];
		return categories.map((cat: ICategoryDetailed) => ({
			name: cat.name,
			code: cat.nameEn,
		}));
	}, [categories]);

	useEffect(() => {
		(async () => {
			const tempGet = userId ? {user_id: userId, completed} : {};
			setGet(tempGet);

			// Добавляем поисковый запрос, если он есть
			const searchParams = initialSearch ? {search: initialSearch} : {};

			const res = await getAllGoals(code, {...tempGet, ...searchParams});
			if (res.success) {
				setGoals(res.data);
			}
		})();
	}, [subPage, code, completed, userId, initialSearch]);

	useEffect(() => {
		(async () => {
			const tempGet = userId ? {user_id: userId, completed} : {};
			setGet(tempGet);

			// Добавляем поисковый запрос, если он есть
			const searchParams = initialSearch ? {search: initialSearch} : {};

			const res = await getAllLists(code, {...tempGet, ...searchParams});
			if (res.success) {
				setLists(res.data);
			}
		})();
	}, [subPage, code, completed, userId, initialSearch]);

	useEffect(() => {
		setActiveSort(0);
		setSearch(initialSearch); // Восстанавливаем начальный поисковый запрос
		setSelectedCategories([]);
	}, [subPage, beginUrl, initialSearch]);

	const fetchData = async (sortValue: string, page?: number, categoriesSort?: string[]): Promise<boolean> => {
		try {
			let res;
			const queryParams = {
				...get,
				sort_by: sortValue,
				page,
				...(categoriesSort && categoriesSort.length > 0 ? {categories: categoriesSort.join(',')} : {}),
			};

			if (subPage === 'goals') {
				res = await getAllGoals(code, queryParams);
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
		}
	};

	const onSelect = async (active: number): Promise<void> => {
		setActiveSort(active);
		await fetchData(sortBy[active].value, undefined, selectedCategories);
	};

	const goToPage = async (active: number): Promise<boolean> => {
		setLoading(true);
		const success = await fetchData(sortBy[activeSort].value, active, selectedCategories);
		scroller.scrollTo('catalog-items-goals', {
			duration: 800,
			delay: 0,
			smooth: 'easeInOutQuart',
			offset: -150,
		});
		setLoading(false);
		return success;
	};

	const onSearch = (query: string) => {
		setSearch(query);
		// Устанавливаем задержку в 300 миллисекунд
		const delay = 300;
		// Если есть предыдущий таймер, сбрасываем его
		if (timer) {
			clearTimeout(timer);
		}
		// Устанавливаем новый таймер
		setTimer(
			setTimeout(async () => {
				// Выполняем поиск только если длина запроса больше или равна 3
				if (subPage === 'goals') {
					if (query.length >= 3) {
						const res = await getAllGoals(code, {
							sort_by: sortBy[activeSort].value,
							search: query,
							...(selectedCategories.length > 0 ? {categories: selectedCategories.join(',')} : {}),
						});
						if (res.success) {
							setGoals(res.data);
						}
					} else {
						// Если длина запроса меньше 3, делаем запрос с пустым значением
						const res = await getAllGoals(code, {
							sort_by: sortBy[activeSort].value,
							search: '',
							...(selectedCategories.length > 0 ? {categories: selectedCategories.join(',')} : {}),
						});
						if (res.success) {
							setGoals(res.data);
						}
					}
				} else if (query.length >= 3) {
					const res = await getAllLists(code, {
						sort_by: sortBy[activeSort].value,
						search: query,
						...(selectedCategories.length > 0 ? {categories: selectedCategories.join(',')} : {}),
					});
					if (res.success) {
						setLists(res.data);
					}
				} else {
					// Если длина запроса меньше 3, делаем запрос с пустым значением
					const res = await getAllLists(code, {
						sort_by: sortBy[activeSort].value,
						search: '',
						...(selectedCategories.length > 0 ? {categories: selectedCategories.join(',')} : {}),
					});
					if (res.success) {
						setLists(res.data);
					}
				}
			}, delay)
		);
	};

	const handleCategoryFilter = async (selected: string[]) => {
		setSelectedCategories(selected);
		await fetchData(sortBy[activeSort].value, undefined, selected);
	};

	const updateGoal = async (codeGoal: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
		// Специальная обработка для добавления цели - проверяем на регулярность
		if (operation === 'add') {
			try {
				// Проверяем, является ли цель регулярной
				const regularSettings = await getRegularGoalSettings(codeGoal);

				if (regularSettings.success && regularSettings.data) {
					// Цель регулярная - показываем модалку настройки
					setRegularGoalData(regularSettings.data);
					setPendingGoalIndex(i); // Запоминаем индекс цели для последующего обновления
					setShowRegularModal(true);
					return; // Выходим из функции, добавление будет происходить в модалке
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
				completedByUser: operation === 'mark' ? !done : goals.data[i].completedByUser,
				totalAdded: res.data.users_added_count,
			};

			const newGoals = [...goals.data];
			newGoals[i] = updatedGoal;

			setGoals({...goals, data: newGoals});
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

	const handleRegularGoalSave = async (settings: any) => {
		if (!regularGoalData?.goal || pendingGoalIndex === null) return;

		setIsRegularLoading(true);
		try {
			const response = await addRegularGoalToUser(regularGoalData.goal.code, {
				goal_code: regularGoalData.goal.code,
				...settings,
			});

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

	return (
		<section className={block()} key={code}>
			<div className={element('filters')}>
				<Switch className={element('switch')} buttons={buttonsSwitch} active={subPage || ''} />
				<FieldInput
					className={element('search')}
					placeholder="Поисковой запрос"
					id="searching"
					value={search}
					setValue={onSearch}
					iconBegin="search"
				/>
				{categories && categories.length > 0 && (
					<FiltersCheckbox
						head={{name: 'Все категории', code: 'all'}}
						items={categoryFilters}
						onFinish={handleCategoryFilter}
						multipleSelectedText={['категория', 'категории', 'категорий']}
						multipleThreshold={1}
					/>
				)}
				<Select options={sortBy} activeOption={activeSort} onSelect={onSelect} filter />
			</div>
			<Loader isLoading={loading}>
				{subPage === 'goals' ? (
					goals.data.length === 0 ? (
						<EmptyState
							title={completed ? 'У вас пока нет выполненных целей' : 'У вас пока нет активных целей'}
							description={
								completed
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
				) : lists.data.length === 0 ? (
					<EmptyState
						title={completed ? 'У вас пока нет выполненных списков' : 'У вас пока нет активных списков'}
						description={
							completed
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
								horizontal
								isList
								onClickAdd={() => updateList(goal.code, i, 'add')}
								onClickDelete={() => updateList(goal.code, i, 'delete')}
							/>
						))}
					</section>
				)}
			</Loader>
			{subPage === 'lists' && lists.data.length > 0 && (
				<Pagination currentPage={lists.pagination.page} totalPages={lists.pagination.totalPages} goToPage={goToPage} />
			)}
			{subPage === 'goals' && goals.data.length > 0 && (
				<Pagination currentPage={goals.pagination.page} totalPages={goals.pagination.totalPages} goToPage={goToPage} />
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
