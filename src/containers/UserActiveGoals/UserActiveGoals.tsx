import {observer} from 'mobx-react';
import {FC, useEffect} from 'react';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';
import {getAddedGoals} from '@/utils/api/get/getAddedGoals';
import './user-active-goals.scss';
import {ListGoals} from '@/components/ListGoals/ListGoals';
import {getAddedLists} from '@/utils/api/get/getAddedLists';

export const UserActiveGoals: FC = observer(() => {
	const [block, element] = useBem('user-goals');

	const {addedGoals, addedLists} = UserStore;

	useEffect(() => {
		(() => {
			getAddedGoals();
			getAddedLists();
		})();
	}, []);

	return (
		<section className={block()}>
			<ListGoals
				className={element('lists')}
				columns="three"
				list={addedLists.lists}
				title="Активные цели"
				count={addedLists.totalAdded}
			/>
			<ListGoals
				columns="four"
				list={addedGoals.goals}
				vertical
				title="Активные цели"
				count={addedGoals.totalAdded}
			/>
		</section>
	);
});
