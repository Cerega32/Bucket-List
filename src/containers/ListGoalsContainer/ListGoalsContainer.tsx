import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {useBem} from '@/hooks/useBem';
import {ContentListGoals} from '@/components/ContentListGoals/ContentListGoals';
import {ThemeStore} from '@/store/ThemeStore';
import {getGoal} from '@/utils/api/get/getGoal';
import {IList} from '@/typings/list';
import './list-goals-container.scss';

export const ListGoalsContainer: FC = () => {
	const [block, element] = useBem('list-goals-container');

	const {setHeader} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const params = useParams();
	const [list, setList] = useState<IList | null>(null);

	useEffect(() => {
		(async () => {
			const res = await getGoal(`goal-lists/${params.id}`);
			if (res.success) {
				console.log(res.data.list);
				setList(res.data.list);
			}
		})();
	}, [params.id]);

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
					text={list.shortDescription}
				/>
				<ContentListGoals className={element('content')} list={list} />
			</article>
		</main>
	);
};
