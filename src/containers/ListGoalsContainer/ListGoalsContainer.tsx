import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {ContentListGoals} from '@/components/ContentListGoals/ContentListGoals';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {IList} from '@/typings/list';
import {getList} from '@/utils/api/get/getList';
import {addGoal} from '@/utils/api/post/addGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {markAllGoalsFromList} from '@/utils/api/post/markAllGoalsFromList';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';
import {GoalWithLocation} from '@/utils/mapApi';
import './list-goals-container.scss';

export const ListGoalsContainer: FC = () => {
	const [block, element] = useBem('list-goals-container');
	const [list, setList] = useState<IList | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const params = useParams();
	const listId = params?.['id'];

	useEffect(() => {
		(async () => {
			setIsLoading(true);
			const res = await getList(`goal-lists/${listId}`);
			if (res.success) {
				setList(res.data.list);
			}
			setIsLoading(false);
		})();
	}, [listId]);

	const updateList = async (code: string, operation: 'add' | 'delete' | 'mark-all'): Promise<void | boolean> => {
		const res = await (operation === 'add'
			? addListGoal(code)
			: operation === 'delete'
			? removeListGoal(code)
			: markAllGoalsFromList(code));

		if (res.success) {
			setList({
				...list,
				...res.data,
			});
			return true;
		}
		return res.success;
	};

	const updateGoal = async (code: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
		const res = await (operation === 'add' ? addGoal(code) : operation === 'delete' ? removeGoal(code) : markGoal(code, !done));

		if (res.success && list) {
			const updatedGoal = {
				...list.goals[i],
				addedByUser: operation !== 'delete',
				completedByUser: operation === 'mark' ? !done : list.goals[i].completedByUser,
				totalAdded: res.data.users_added_count,
			};

			const newGoals = [...list.goals];
			newGoals[i] = updatedGoal;

			let {userCompletedGoals} = list;

			if (operation === 'mark' && !done && !list.goals[i].completedByUser) {
				userCompletedGoals += 1;
			} else if (operation === 'mark' && done && list.goals[i].completedByUser) {
				userCompletedGoals -= 1;
			}

			const completedByUser = userCompletedGoals === list.goalsCount;

			setList({
				...list,
				goals: newGoals,
				userCompletedGoals,
				completedByUser,
				totalCompleted: completedByUser ? list.totalCompleted + 1 : list.totalCompleted,
			});
		}
	};

	if (!list) {
		return <Loader isLoading={isLoading} />;
	}

	// Собираем массив целей с локацией для карты
	const goalsWithLocation = list.goals
		.filter((goal) => goal.location && typeof goal.location.latitude === 'number' && typeof goal.location.longitude === 'number')
		.map((goal) => ({
			location: goal.location,
			userVisitedLocation: goal.completedByUser,
			name: goal.title,
			address: goal.location?.address,
			description: goal.description,
		})) as Partial<GoalWithLocation>[];

	return (
		<main className={block()}>
			<article className={element('wrapper')}>
				{/* {goalsWithLocation.length > 0 && (
					<div style={{marginBottom: 32}}>
						<GoalMapMulti goals={goalsWithLocation} />
					</div>
				)} */}
				<AsideGoal
					className={element('aside')}
					title={list.title}
					image={list.image}
					updateGoal={updateList}
					added={list.addedByUser}
					code={list.code}
					isList
					done={list.completedByUser}
					canEdit={list.isCanEdit || list.isCanAddGoals}
					location={goalsWithLocation}
				/>
				<ContentListGoals className={element('content')} list={list} updateGoal={updateGoal} />
			</article>
		</main>
	);
};
