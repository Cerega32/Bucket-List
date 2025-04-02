import {FC, useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';

import {AllCategories} from '@/components/AllCategories/AllCategories';
import {Button} from '@/components/Button/Button';
import {Card} from '@/components/Card/Card';
import {CatalogItems} from '@/components/CatalogItems/CatalogItems';
import {HeaderCategory} from '@/components/HeaderCategory/HeaderCategory';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ICategoryDetailed, ICategoryWithSubcategories, IGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import {IPage} from '@/typings/page';
import {getCategories} from '@/utils/api/get/getCategories';
import {getCategory} from '@/utils/api/get/getCategory';
import {getPopularGoals} from '@/utils/api/get/getPopularGoals';
import {getPopularLists} from '@/utils/api/get/getPopularLists';
import {addGoal} from '@/utils/api/post/addGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';

import './category.scss';

export const Category: FC<IPage> = ({subPage, page}) => {
	const [block, element] = useBem('category');

	const [category, setCategory] = useState<ICategoryWithSubcategories | null>(null);
	const [popularGoals, setPopularGoals] = useState<Array<IGoal>>([]);
	const [popularLists, setPopularLists] = useState<Array<IList>>([]);
	const [categories, setCategories] = useState<Array<ICategoryDetailed>>([]);

	const refTitle = useRef<HTMLElement>(null);

	const {id} = useParams();

	useEffect(() => {
		(async () => {
			if (!id) {
				const res = await getCategories();
				if (res.success) {
					setCategories(res.data);
				}
			}
		})();
	}, [id]);

	useEffect(() => {
		if (id) {
			(async () => {
				const res = await getCategory(id);

				if (res.success) {
					setCategory(res.data);
				}
			})();
		}
	}, [id]);

	useEffect(() => {
		(async () => {
			const res = await getPopularGoals(id || 'all');

			if (res.success) {
				setPopularGoals(res.data);
			}
		})();
	}, [id]);

	useEffect(() => {
		(async () => {
			const res = await getPopularLists(id || 'all');

			if (res.success) {
				setPopularLists(res.data);
			}
		})();
	}, [id]);

	const updateGoal = async (code: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
		const res = await (operation === 'add' ? addGoal(code) : operation === 'delete' ? removeGoal(code) : markGoal(code, !done));

		if (res.success && popularGoals) {
			const updatedGoal = {
				...popularGoals[i],
				addedByUser: operation !== 'delete',
				completedByUser: operation === 'mark' ? !done : popularGoals[i].completedByUser,
				totalAdded: res.data.users_added_count,
			};

			const newGoals = [...popularGoals];
			newGoals[i] = updatedGoal;

			setPopularGoals(newGoals);
		}
	};

	const updateList = async (code: string, i: number, operation: 'add' | 'delete'): Promise<void> => {
		const res = await (operation === 'add' ? addListGoal(code) : removeListGoal(code));

		if (res.success) {
			const updatedList = {
				...popularLists[i],
				addedByUser: operation === 'add',
				totalAdded: res.data.users_added_count,
			};

			const newLists = [...popularLists];
			newLists[i] = updatedList;

			setPopularLists(newLists);
		}
	};

	return (
		<main className={block({sub: page === 'isSubCategories', empty: !category?.subcategories.length, all: !id})}>
			{id && id !== 'all' && category && (
				<HeaderCategory category={category} className={element('header')} isSub={page === 'isSubCategories'} refHeader={refTitle} />
			)}
			{!!popularGoals.length && (
				<>
					<div className={element('wrapper-title')}>
						<Title tag="h2">Популярные цели этой недели</Title>
						<Button type="Link" theme="blue" icon="plus" href={`/goals/create${id && id !== 'all' ? `?category=${id}` : ''}`}>
							Добавить цель
						</Button>
					</div>

					<section className={element('popular-goals')}>
						{popularGoals.map((goal, i) => (
							<Card
								goal={goal}
								className={element('popular-goal')}
								key={goal.code}
								onClickAdd={() => updateGoal(goal.code, i, 'add')}
								onClickDelete={() => updateGoal(goal.code, i, 'delete')}
								onClickMark={() => updateGoal(goal.code, i, 'mark', goal.completedByUser)}
							/>
						))}
					</section>
				</>
			)}
			{!!popularLists.length && (
				<>
					<div className={element('wrapper-title')}>
						<Title tag="h2">Популярные списки этой недели</Title>
						<Button type="Link" theme="blue" icon="plus" href={`/list/create${id && id !== 'all' ? `?category=${id}` : ''}`}>
							Добавить список целей
						</Button>
					</div>
					<section className={element('popular-lists')}>
						{popularLists.map((list, i) => (
							<Card
								horizontal
								isList
								goal={list}
								className={element('popular-list')}
								key={list.code}
								onClickAdd={() => updateList(list.code, i, 'add')}
								onClickDelete={() => updateList(list.code, i, 'delete')}
							/>
						))}
					</section>
				</>
			)}

			<Title className={element('title')} tag="h2">
				Все цели и списки
			</Title>
			<CatalogItems
				code={id || 'all'}
				className={element('all-goals')}
				subPage={subPage}
				category={category}
				beginUrl={id ? '/categories/' : '/categories/all'}
				categories={categories}
			/>
			{!id && <AllCategories categories={categories} />}
		</main>
	);
};
