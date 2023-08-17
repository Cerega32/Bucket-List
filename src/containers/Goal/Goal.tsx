import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {HeaderGoal} from '@/components/HeaderGoal/HeaderGoal';
import {ContentGoal} from '@/components/ContentGoal/ContentGoal';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {Modal} from '@/components/Modal/Modal';
import {IGoal} from '@/typings/goal';
import {getGoal} from '@/utils/api/get/getGoal';
import './goal.scss';

export const Goal: FC = () => {
	const [block, element] = useBem('goal');

	const {setHeader} = ThemeStore;

	const params = useParams();
	const [goal, setGoal] = useState<IGoal | null>(null);

	useEffect(() => {
		(async () => {
			const res = await getGoal(`goals/${params.id}`);
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

	return (
		<main className={block()}>
			<HeaderGoal
				title={goal.title}
				category="goal.category.name"
				image={goal.image}
				goal={goal}
			/>
			<section className={element('wrapper')}>
				<AsideGoal
					className={element('aside')}
					title={goal.title}
					image={goal.image}
					text={goal.shortDescription}
				/>
				<ContentGoal goal={goal} className={element('content')} />
			</section>
			<Modal />
		</main>
	);
};
