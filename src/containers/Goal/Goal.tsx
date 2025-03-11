import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {ContentGoal} from '@/components/ContentGoal/ContentGoal';
import {HeaderGoal} from '@/components/HeaderGoal/HeaderGoal';
import {useBem} from '@/hooks/useBem';
import {GoalStore} from '@/store/GoalStore';
import {ModalStore} from '@/store/ModalStore';
import {IGoal} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {getGoal} from '@/utils/api/get/getGoal';
import {addGoal} from '@/utils/api/post/addGoal';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';
import './goal.scss';

export const Goal: FC<IPage> = ({page}) => {
	const [block, element] = useBem('goal');

	const {setId} = GoalStore;
	const params = useParams();
	const listId = params?.['id'];
	const [goal, setGoal] = useState<IGoal | null>(null);

	const {setIsOpen, setWindow} = ModalStore;

	useEffect(() => {
		(async () => {
			if (listId) {
				const res = await getGoal(listId);
				if (res.success) {
					setGoal(res.data.goal);
					setId(res.data.goal.id);
				}
			}
		})();
	}, [listId]);

	if (!goal) {
		return null;
	}

	const openAddReview = () => {
		setWindow('add-review');
		setIsOpen(true);
	};

	const updateGoal = async (code: string, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
		const res = await (operation === 'add'
			? addGoal(code)
			: operation === 'delete'
			? removeGoal(code)
			: markGoal(
					code,
					!done,
					!done
						? {
								title: 'Цель успешно выполнена!',
								type: 'success',
								id: goal.id.toString(),
								message: 'Добавьте отзыв чтобы заработать больше очков',
								actionText: 'Добавить отзыв',
								action: openAddReview,
						  }
						: undefined
			  ));

		if (res.success) {
			const updatedGoal = {
				addedByUser: operation !== 'delete',
				completedByUser: operation === 'mark' ? !done : false,
				totalAdded: res.data.totalAdded,
				totalCompleted: res.data.totalCompleted,
			};

			setGoal({...goal, ...updatedGoal});
		}
	};

	return (
		<main className={block()}>
			<HeaderGoal title={goal.title} category={goal.category} image={goal.image} goal={goal} />
			<section className={element('wrapper')}>
				<AsideGoal
					className={element('aside')}
					title={goal.title}
					image={goal.image}
					updateGoal={updateGoal}
					code={goal.code}
					done={goal.completedByUser}
					added={goal.addedByUser}
					openAddReview={openAddReview}
				/>
				<ContentGoal page={page} goal={goal} className={element('content')} />
			</section>
		</main>
	);
};
