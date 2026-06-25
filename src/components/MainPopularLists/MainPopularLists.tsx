import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Card} from '@/components/Card/Card';
import {Loader} from '@/components/Loader/Loader';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {IShortList} from '@/typings/goal';
import {getPopularLists} from '@/utils/api/get/getPopularLists';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';

import './main-popular-lists.scss';

export const MainPopularLists: FC = observer(() => {
	const [block, element] = useBem('main-popular-lists');
	const {isScreenSmallMobile} = useScreenSize();
	const {isAuth} = UserStore;
	const [lists, setLists] = useState<IShortList[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			setLoading(true);
			const response = await getPopularLists('all');
			if (response.success) {
				setLists(response.data);
			}
			setLoading(false);
		})();
	}, [isAuth]);

	const updateList = async (code: string, i: number, operation: 'add' | 'delete') => {
		const res = await (operation === 'add' ? addListGoal(code) : removeListGoal(code));

		if (res.success) {
			const updatedList = {
				...lists[i],
				addedByUser: operation === 'add',
				completedByUser: operation === 'delete' ? false : lists[i].completedByUser,
				totalAdded: res.data.totalAdded,
			};
			const newLists = [...lists];
			newLists[i] = updatedList;
			setLists(newLists);
			return;
		}

		NotificationStore.addNotification({
			type: 'error',
			title: 'Ошибка',
			message: res.error || 'Не удалось обновить список',
		});
	};

	if (loading) {
		return (
			<section className={block()}>
				<Loader isLoading />
			</section>
		);
	}

	if (!lists.length) {
		return null;
	}

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Популярные списки
			</Title>
			<div className={element('lists')}>
				{lists.map((list, i) => (
					<Card
						key={list.code}
						isList
						goal={list}
						className={element('list', {featured: i === 0})}
						horizontal={!isScreenSmallMobile && i === 0}
						onClickAdd={() => updateList(list.code, i, 'add')}
						onClickDelete={() => updateList(list.code, i, 'delete')}
					/>
				))}
			</div>
		</section>
	);
});
