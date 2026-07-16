import {FC, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {IFuncModal} from '@/store/ModalStore';
import {refreshHeaderGoalCounts} from '@/utils/refreshHeaderGoalCounts';

import {Title} from '../Title/Title';
import './delete-list.scss';

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
