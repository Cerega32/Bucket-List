import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {GoalStore} from '@/store/GoalStore';
import {getListsWithGoals} from '@/utils/api/get/getListsWithGoal';
import {addListGoal} from '@/utils/api/post/addListGoal';
import {removeListGoal} from '@/utils/api/post/removeListGoal';

import {Card} from '../Card/Card';
import {EmptyState} from '../EmptyState/EmptyState';
import {ModalConfirm} from '../ModalConfirm/ModalConfirm';
import './lists-with-goal.scss';

interface ListsWithGoalProps {
	className?: string;
	code: string;
	onListChanged?: () => void;
}

export const ListsWithGoal: FC<ListsWithGoalProps> = observer((props) => {
	const {className, code, onListChanged} = props;

	const [block] = useBem('lists-with-goal', className);
	const {lists, setLists, setInfoPaginationLists} = GoalStore;

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<{code: string; index: number; title: string} | null>(null);
	const {isScreenSmallMobile} = useScreenSize();

	useEffect(() => {
		(async () => {
			const res = await getListsWithGoals(code);

			if (res.success) {
				setLists(res.data.data);
				setInfoPaginationLists(res.data.pagination);
			}
		})();
	}, [code]);

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

	const handleDeleteClick = (listCode: string, index: number, title: string) => {
		setDeleteTarget({code: listCode, index, title});
		setIsDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (deleteTarget) {
			await updateListGoal(deleteTarget.code, deleteTarget.index, 'delete');
		}
		setIsDeleteModalOpen(false);
		setDeleteTarget(null);
	};

	return (
		<section className={block()} id="goal-lists-section">
			{lists && lists.length > 0 ? (
				lists.map((list, i) => (
					<Card
						goal={list}
						isList
						horizontal={!isScreenSmallMobile}
						onClickAdd={() => updateListGoal(list.code, i, 'add')}
						onClickDelete={async () => handleDeleteClick(list.code, i, list.title)}
						key={list.code}
					/>
				))
			) : (
				<EmptyState title="Пока нет списков с этой целью" description="Создайте список, чтобы включить в него эту цель" />
			)}
			<ModalConfirm
				title="Удалить список?"
				isOpen={isDeleteModalOpen}
				onClose={() => {
					setIsDeleteModalOpen(false);
					setDeleteTarget(null);
				}}
				themeBtn="red"
				handleBtn={handleConfirmDelete}
				textBtn="Удалить"
				text={`Вы уверены, что хотите удалить список "${
					deleteTarget?.title || ''
				}" из ваших списков?\nВсе цели, которые были добавлены с этим списком, будут также удалены вместе с впечатлениями.`}
			/>
		</section>
	);
});
