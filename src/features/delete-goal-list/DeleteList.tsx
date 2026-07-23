import {FC, useState} from 'react';

import {refreshHeaderGoalCounts} from '@/entities/goal/lib/refreshHeaderGoalCounts';
import {useBem} from '@/shared/lib/hooks/useBem';
import {IFuncModal} from '@/shared/model/ModalStore';
import {Button} from '@/shared/ui/Button/Button';
import {Title} from '@/shared/ui/Title/Title';
import '@/features/delete-goal-list/delete-list.scss';

interface DeleteListProps {
	className?: string;
	closeModal: () => void;
	funcModal: IFuncModal;
}

export const DeleteList: FC<DeleteListProps> = (props) => {
	const {className, closeModal, funcModal} = props;
	const [isDelete, setIsDelete] = useState(false);

	const [block, element] = useBem('delete-list', className);

	const handleDeleteList = async () => {
		setIsDelete(true);
		const raw = funcModal();
		const ok = raw instanceof Promise ? await raw : raw;
		if (ok === false) {
			setIsDelete(false);
			return;
		}
		try {
			await refreshHeaderGoalCounts();
		} catch (e) {
			console.error(e);
		} finally {
			setIsDelete(false);
		}
		closeModal();
	};

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Удаление списка целей
			</Title>
			<p className={element('text')}>
				Вы действительно хотите удалить список? Будут удалены список, все цели в нём и все оставленные впечатления.
			</p>
			<div className={element('btns-wrapper')}>
				<Button theme="blue-light" className={element('btn')} onClick={closeModal}>
					Отмена
				</Button>
				<Button theme="red" className={element('btn')} onClick={handleDeleteList} disabled={isDelete}>
					{isDelete ? 'Удаление...' : 'Удалить'}
				</Button>
			</div>
		</section>
	);
};
