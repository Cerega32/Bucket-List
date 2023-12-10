import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {useBem} from '@/hooks/useBem';
import {ContentListGoals} from '@/components/ContentListGoals/ContentListGoals';
import {ThemeStore} from '@/store/ThemeStore';
import {getGoal} from '@/utils/api/get/getCategories';
import {IList} from '@/typings/list';
import './list-goals-container.scss';
import {GET, POST} from '@/utils/fetch/requests';
import {getList} from '@/utils/api/get/getList';
import {addGoal} from '@/utils/api/post/addGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {markGoal} from '@/utils/api/post/markGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';
import {markAllGoalsFromList} from '@/utils/api/post/markAllGoalsFromList';

export const ListGoalsContainer: FC = () => {
	const [block, element] = useBem('list-goals-container');
	const [list, setList] = useState<IList | null>(null);

	const {setHeader} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const params = useParams();

	useEffect(() => {
		(async () => {
			const res = await getList(`goal-lists/${params['id']}`);
			if (res.success) {
				setList(res.data.list);
			}
		})();
	}, [params['id']]);

	const updateList = async (
		code: string,
		operation: 'add' | 'delete' | 'mark-all'
	): Promise<void> => {
		const res = await (operation === 'add'
			? addListGoal(code)
			: operation === 'delete'
			? removeListGoal(code)
			: markAllGoalsFromList(code));

		if (res.success) {
			setList({
				...list,
				...res.data,
				goals: list?.goals.map((goal) => {
					return {
						...goal,
						completedByUser:
							operation === 'mark-all'
								? true
								: goal.completedByUser,
					};
				}),
			});
		}
	};

	const updateGoal = async (
		code: string,
		i: number,
		operation: 'add' | 'delete' | 'mark',
		done?: boolean
	): Promise<void> => {
		const res = await (operation === 'add'
			? addGoal(code)
			: operation === 'delete'
			? removeGoal(code)
			: markGoal(code, !done));

		if (res.success && list) {
			const updatedGoal = {
				...list.goals[i],
				addedByUser: operation !== 'delete',
				completedByUser:
					operation === 'mark'
						? !done
						: list.goals[i].completedByUser,
				totalAdded: res.data.users_added_count,
			};

			const newGoals = [...list.goals];
			newGoals[i] = updatedGoal;

			setList({...list, goals: newGoals});
		}
	};

	if (!list) {
		return null;
	}

	return (
		<main className={block()}>
			<article className={element('wrapper')}>
				<AsideGoal
					className={element('aside')}
					title={list.title}
					image={list.image}
					updateGoal={updateList}
					added={list.addedByUser}
					code={list.code}
					isList
				/>
				<ContentListGoals
					className={element('content')}
					list={list}
					updateGoal={updateGoal}
				/>
			</article>
		</main>
	);
};
