import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {ContentGoal} from '@/components/ContentGoal/ContentGoal';
import {HeaderGoal} from '@/components/HeaderGoal/HeaderGoal';
import {Modal} from '@/components/Modal/Modal';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {IGoal} from '@/typings/goal';
import './goal.scss';
import {IPage} from '@/typings/page';
import {getCategories} from '@/utils/api/get/getCategories';
import {getGoal} from '@/utils/api/get/getGoal';
import {addGoal} from '@/utils/api/post/addGoal';
import {markGoal} from '@/utils/api/post/markGoal';
import {removeGoal} from '@/utils/api/post/removeGoal';

export const Goal: FC<IPage> = ({page}) => {
	const [block, element] = useBem('goal');

	const {setHeader} = ThemeStore;

	const params = useParams();
	const [goal, setGoal] = useState<IGoal | null>(null);

	useEffect(() => {
		(async () => {
			const res = await getGoal(params.id);
			if (res.success) {
				setGoal(res.data.goal);
			}
		})();
	}, [params.id]);

	useEffect(() => {
		setHeader('transparent');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (!goal) {
		return null;
	}

	const updateGoal = async (code: string, operation: 'add' | 'delete' | 'mark', done?: boolean): Promise<void> => {
		const res = await (operation === 'add' ? addGoal(code) : operation === 'delete' ? removeGoal(code) : markGoal(code, !done));

		if (res.success) {
			const updatedGoal = {
				addedByUser: operation !== 'delete',
				completedByUser: operation === 'mark' ? !done : false,
				totalAdded: res.data.totalAdded,
				totalCompleted: res.data.totalCompleted,
			};

			setGoal({...goal, ...updatedGoal});
			console.log({...goal, ...updatedGoal});
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
				/>
				<ContentGoal page={page} goal={goal} className={element('content')} />
			</section>
		</main>
	);
};
