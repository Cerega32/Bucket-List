import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {IShortList} from '@/entities/goal/model/types';
import {Card} from '@/entities/goal/ui/Card/Card';
import {addListGoal} from '@/entities/goal-list/api/addListGoal';
import {getPopularLists} from '@/entities/goal-list/api/getPopularLists';
import {removeListGoal} from '@/entities/goal-list/api/removeListGoal';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {Loader} from '@/shared/ui/Loader/Loader';
import {Title} from '@/shared/ui/Title/Title';

import '@/widgets/main-popular-lists/main-popular-lists.scss';

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

	const horizontalLists = lists.slice(0, 4);
	const gridLists = lists.slice(4);

	const renderCard = (list: IShortList, i: number, layout: 'horizontal' | 'grid') => (
		<Card
			key={list.code}
			isList
			goal={list}
			className={element('list', {[layout]: true})}
			horizontal={!isScreenSmallMobile}
			onClickAdd={() => updateList(list.code, i, 'add')}
			onClickDelete={() => updateList(list.code, i, 'delete')}
		/>
	);

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Популярные списки
			</Title>
			<div className={element('lists')}>
				{!!horizontalLists.length && (
					<div className={element('horizontal-grid')}>{horizontalLists.map((list, i) => renderCard(list, i, 'horizontal'))}</div>
				)}
				{!!gridLists.length && <div className={element('grid')}>{gridLists.map((list, i) => renderCard(list, i + 4, 'grid'))}</div>}
			</div>
		</section>
	);
});
