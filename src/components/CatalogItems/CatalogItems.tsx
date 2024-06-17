import {FC, useEffect, useMemo, useState} from 'react';

import './catalog-items.scss';

import {Card} from '../Card/Card';
import {FieldInput} from '../FieldInput/FieldInput';

import {FiltersCheckbox} from '../FiltersCheckbox/FiltersCheckbox';
import {Notification} from '../Notification/Notification';
import {Pagination} from '../Pagination/Pagination';
import Select, {OptionSelect} from '../Select/Select';
import {Switch} from '../Switch/Switch';

import {useBem} from '@/hooks/useBem';
import {ICategoryDetailed, ICategoryWithSubcategories, IGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import {IPaginationPage} from '@/typings/request';
import {getAllGoals} from '@/utils/api/get/getAllGoals';
import {getAllLists} from '@/utils/api/get/getAllLists';
import {addGoal} from '@/utils/api/post/addGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';
import {defaultPagination} from '@/utils/data/default';

interface CatalogItemsProps {
	className?: string;
	subPage?: string;
	beginUrl: string;
	columns?: string;
}

interface CatalogItemsCategoriesProps extends CatalogItemsProps {
	code: string;
	category: ICategoryWithSubcategories;
	userId?: never;
	completed?: never;
}

interface CatalogItemsUsersProps extends CatalogItemsProps {
	userId: string;
	code?: never;
	category?: never;
	completed: boolean;
}

const sortBy: Array<OptionSelect> = [
	{
		name: 'Сначала новые',
		value: '-created_at',
	},
	{
		name: 'Сначала старые',
		value: 'created_at',
	},
	{
		name: 'Сначала самые популярные',
		value: '-added_by_users',
	},
	{
		name: 'Сначала больше всего выполненные',
		value: '-completed_by_users',
	},
];

export const CatalogItems: FC<CatalogItemsCategoriesProps | CatalogItemsUsersProps> = (props) => {
	const {className, code, subPage, category, userId, completed, beginUrl, columns} = props;

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
	const [search, setSearch] = useState('');
	const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
	const [get, setGet] = useState(userId ? {user_id: userId, completed} : {});
	const [codeUrl] = useState(code || 'all');

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

	useEffect(() => {
		(async () => {
			const tempGet = userId ? {user_id: userId, completed} : {};
			setGet(tempGet);
			const res = await getAllGoals(codeUrl, tempGet);
			if (res.success) {
				setGoals(res.data);
			}
		})();
	}, [subPage, codeUrl, completed, userId]);

	useEffect(() => {
		(async () => {
			const tempGet = userId ? {user_id: userId, completed} : {};
			setGet(tempGet);
			const res = await getAllLists(codeUrl, tempGet);
			if (res.success) {
				setLists(res.data);
			}
		})();
	}, [subPage, codeUrl, completed, userId]);

	useEffect(() => {
		setActiveSort(0);
		setSearch('');
	}, [subPage, beginUrl]);

	const fetchData = async (sortValue: string, page?: number): Promise<boolean> => {
		try {
			let res;

			if (subPage === 'goals') {
				res = await getAllGoals(codeUrl, {...get, sort_by: sortValue, page});
			} else {
				res = await getAllLists(codeUrl, {...get, sort_by: sortValue, page});
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
			console.error('Error fetching data:', error);
			return false;
		}
	};

	const onSelect = async (active: number): Promise<void> => {
		setActiveSort(active);
		await fetchData(sortBy[active].value);
	};

	const goToPage = async (active: number): Promise<boolean> => {
		const success = await fetchData(sortBy[active].value, active);
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
						const res = await getAllGoals(codeUrl, {
							sort_by: sortBy[activeSort].value,
							search: query,
						});
						if (res.success) {
							setGoals(res.data);
						}
					} else {
						// Если длина запроса меньше 3, делаем запрос с пустым значением
						const res = await getAllGoals(codeUrl, {
							sort_by: sortBy[activeSort].value,
							search: '',
						});
						if (res.success) {
							setGoals(res.data);
						}
					}
				} else if (query.length >= 3) {
					const res = await getAllLists(codeUrl, {
						sort_by: sortBy[activeSort].value,
						search: query,
					});
					if (res.success) {
						setGoals(res.data);
					}
				} else {
					// Если длина запроса меньше 3, делаем запрос с пустым значением
					const res = await getAllLists(codeUrl, {
						sort_by: sortBy[activeSort].value,
						search: '',
					});
					if (res.success) {
						setGoals(res.data);
					}
				}
			}, delay)
		);
	};

	const updateGoal = async (codeGoal: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
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

			setLists({...goals, data: newLists});
		}
	};
	console.log('columns', columns);

	return (
		<section className={block()}>
			<div className={element('filters')}>
				<Switch className={element('switch')} buttons={buttonsSwitch} active={subPage} />
				<FieldInput
					className={element('search')}
					placeholder="Поисковой запрос"
					id="searching"
					value={search}
					setValue={onSearch}
					iconBegin="search"
				/>
				{!!userId && (
					<FiltersCheckbox
						head={{name: 'Все категории', code: 'all'}}
						items={[
							{name: 'Путешествия', code: 'travel'},
							{name: 'Путешествия', code: 'trave'},
							{name: 'Путешествия', code: 'trav'},
							{name: 'Путешествия', code: 'tra'},
						]}
					/>
				)}
				<Select options={sortBy} activeOption={activeSort} onSelect={onSelect} filter />
			</div>
			{subPage === 'goals' ? (
				<section className={element('goals', {columns})}>
					{goals.data.map((goal, i) => (
						<Card
							className={element('goal')}
							goal={goal}
							key={goal.code}
							onClickAdd={() => updateGoal(goal.code, i, 'add')}
							onClickDelete={() => updateGoal(goal.code, i, 'delete')}
							onClickMark={() => updateGoal(goal.code, i, 'mark')}
						/>
					))}
				</section>
			) : (
				<section className={element('goals', {columns})}>
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
			{subPage === 'lists' ? (
				<Pagination currentPage={lists.pagination.page} totalPages={lists.pagination.totalPages} goToPage={goToPage} />
			) : (
				<Pagination currentPage={goals.pagination.page} totalPages={goals.pagination.totalPages} goToPage={goToPage} />
			)}
		</section>
	);
};
