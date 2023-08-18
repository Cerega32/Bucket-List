import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {AsideGoal} from '@/components/AsideGoal/AsideGoal';
import {useBem} from '@/hooks/useBem';
import {ContentListGoals} from '@/components/ContentListGoals/ContentListGoals';
import {ThemeStore} from '@/store/ThemeStore';
import {getGoal} from '@/utils/api/get/getGoal';
import {IList} from '@/typings/list';
import './list-goals-container.scss';
import {GET, POST} from '@/utils/fetch/requests';

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
			const res = await getGoal(`goal-lists/${params.id}`);
			if (res.success) {
				setList(res.data.list);
			}
		})();
	}, [params.id]);

	useEffect(() => {
		(async () => {
			const res = await GET('self/added-goals', true);
			console.log(res);
		})();
	}, [params.id]);

	const addList = async () => {
		const res = await POST(`goal-lists/${params.id}/add`, {}, true);
		if (res.success && list) {
			const newList: IList = {
				...list,
				addedByUser: true,
				addedUsersCount: (list?.addedUsersCount || 0) + 1,
			};
			setList(newList);
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
					text={list.shortDescription}
					onAdded={addList}
					added={list.addedByUser}
				/>
				<ContentListGoals className={element('content')} list={list} />
			</article>
		</main>
	);
};
