import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';

import {useBem} from '@/hooks/useBem';
import {GoalStore} from '@/store/GoalStore';
import {getListsWithGoals} from '@/utils/api/get/getListsWithGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';

import {Card} from '../Card/Card';
import './lists-with-goal.scss';

interface ListsWithGoalProps {
	className?: string;
	code: string;
}

export const ListsWithGoal: FC<ListsWithGoalProps> = observer((props) => {
	const {className, code} = props;

	const [block] = useBem('lists-with-goal', className);
	const {lists, setLists, setInfoPaginationLists} = GoalStore;

	useEffect(() => {
		(async () => {
			const res = await getListsWithGoals(code);

			if (res.success) {
				setLists(res.data.data);
				setInfoPaginationLists(res.data.pagination);
			}
		})();
	}, [code, setLists, setInfoPaginationLists]);

	const updateListGoal = async (codeList: string, i: number, operation: 'add' | 'delete'): Promise<void> => {
		const res = await (operation === 'add' ? addListGoal(codeList) : removeListGoal(codeList));

		if (res.success && lists) {
			const startLists = lists.slice(0, i);
			const endLists = lists.slice(i + 1);

			setLists([...startLists, res.data, ...endLists]);
		}
	};

	return (
		<section className={block()}>
			{lists.map((list, i) => (
				<Card
					goal={list}
					isList
					horizontal
					onClickAdd={() => updateListGoal(list.code, i, 'add')}
					onClickDelete={() => updateListGoal(list.code, i, 'delete')}
					key={list.code}
				/>
			))}
		</section>
	);
});
