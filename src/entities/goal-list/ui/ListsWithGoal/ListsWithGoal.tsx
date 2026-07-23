import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';

import {GoalStore} from '@/entities/goal/model/GoalStore';
import {Card} from '@/entities/goal/ui/Card/Card';
import {addListGoal} from '@/entities/goal-list/api/addListGoal';
import {getListsWithGoals} from '@/entities/goal-list/api/getListsWithGoal';
import {removeListGoal} from '@/entities/goal-list/api/removeListGoal';
import {ListsWithGoalSkeleton} from '@/entities/goal-list/ui/ListsWithGoal/ListsWithGoalSkeleton';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';

import '@/entities/goal-list/ui/ListsWithGoal/lists-with-goal.scss';

interface ListsWithGoalProps {
	className?: string;
	code: string;
	onListChanged?: () => void;
}

export const ListsWithGoal: FC<ListsWithGoalProps> = observer((props) => {
	const {className, code, onListChanged} = props;

	const [block] = useBem('lists-with-goal', className);
	const {lists, setLists, setInfoPaginationLists, listsLoadedForCode, setListsLoadedForCode} = GoalStore;

	const {isScreenSmallMobile} = useScreenSize();

	useEffect(() => {
		if (listsLoadedForCode === code) return undefined;
		let cancelled = false;
		setLists([]);
		setListsLoadedForCode(null);
		(async () => {
			const res = await getListsWithGoals(code);
			if (cancelled) return;

			if (res.success) {
				setLists(res.data.data);
				setInfoPaginationLists(res.data.pagination);
			}
			setListsLoadedForCode(code);
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [code]);

	const isFresh = listsLoadedForCode === code;

	const updateListGoal = async (codeList: string, i: number, operation: 'add' | 'delete'): Promise<void> => {
		const res = await (operation === 'add' ? addListGoal(codeList) : removeListGoal(codeList));

		if (res.success && lists) {
			const startLists = lists.slice(0, i);
			const endLists = lists.slice(i + 1);

			setLists([...startLists, res.data, ...endLists]);

			if (onListChanged) {
				onListChanged();
			}
		}
	};

	return (
		<section className={block()} id="goal-lists-section">
			{!isFresh ? (
				<ListsWithGoalSkeleton />
			) : lists && lists.length > 0 ? (
				lists.map((list, i) => (
					<Card
						goal={list}
						isList
						horizontal={!isScreenSmallMobile}
						onClickAdd={() => updateListGoal(list.code, i, 'add')}
						onClickDelete={() => updateListGoal(list.code, i, 'delete')}
						key={list.code}
					/>
				))
			) : (
				<EmptyState title="Пока нет списков с этой целью" description="Создайте список, чтобы включить в него эту цель" />
			)}
		</section>
	);
});
