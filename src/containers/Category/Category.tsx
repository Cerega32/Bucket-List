import {FC, useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';

import {Card} from '@/components/Card/Card';
import {CatalogItems} from '@/components/CatalogItems/CatalogItems';
import {HeaderCategory} from '@/components/HeaderCategory/HeaderCategory';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {ICategoryWithSubcategories, IGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import {IPage} from '@/typings/page';

import './category.scss';
import {getCategory} from '@/utils/api/get/getCategory';
import {getPopularGoals} from '@/utils/api/get/getPopularGoals';
import {getPopularLists} from '@/utils/api/get/getPopularLists';
import {addGoal} from '@/utils/api/post/addGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';

export const Category: FC<IPage> = ({subPage, page}) => {
	const [block, element] = useBem('category');

	const [category, setCategory] = useState<ICategoryWithSubcategories | null>(null);
	const [popularGoals, setPopularGoals] = useState<Array<IGoal>>([]);
	const [popularLists, setPopularLists] = useState<Array<IList>>([]);
	const refTitle = useRef<HTMLElement>(null);

	const {id} = useParams();
	const {setHeader} = ThemeStore;

	useEffect(() => {
		(async () => {
			const res = await getCategory(id);

			if (res.success) {
				setCategory(res.data);
			}
		})();
	}, [id]);

	useEffect(() => {
		(async () => {
			console.log(id, '!!!!!!');
			const res = await getPopularGoals(id);

			if (res.success) {
				setPopularGoals(res.data);
			}
		})();
	}, [id]);

	useEffect(() => {
		(async () => {
			const res = await getPopularLists(id);

			if (res.success) {
				setPopularLists(res.data);
			}
		})();
	}, [id]);

	useEffect(() => {
		setHeader('transparent');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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

	if (!category) {
		return null;
	}

	return (
		<main className={block({sub: page === 'isSubCategories'})}>
			<HeaderCategory category={category} className={element('header')} isSub={page === 'isSubCategories'} ref={refTitle} />
			{popularGoals.length && (
				<>
					<Title className={element('title')} tag="h2">
						Популярные цели этой недели
					</Title>
					<section className={element('popular-goals')}>
						{popularGoals.map((goal, i) => (
							<Card
								goal={goal}
								className={element('popular-goal')}
								key={goal.code}
								onClickAdd={() => updateGoal(goal.code, i, 'add')}
								onClickDelete={() => updateGoal(goal.code, i, 'delete')}
								onClickMark={() => updateGoal(goal.code, i, 'mark')}
							/>
						))}
					</section>
				</>
			)}
			{popularLists.length && (
				<>
					<Title className={element('title')} tag="h2">
						Популярные списки этой недели
					</Title>
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
			<CatalogItems code={id} className={element('all-goals')} subPage={subPage} category={category} beginUrl="/categories/" />
		</main>
	);
};
