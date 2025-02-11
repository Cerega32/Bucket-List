import {FC} from 'react';

import {Title} from '../Title/Title';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import './delete-list.scss';
import {IFuncModal} from '@/store/ModalStore';

interface DeleteListProps {
	className?: string;
	closeModal: () => void;
	funcModal: IFuncModal;
}

export const DeleteList: FC<DeleteListProps> = (props) => {
	const {className, closeModal, funcModal} = props;

	const [block, element] = useBem('delete-list', className);

	const handleDeleteList = async () => {
		const res = funcModal(); // TODO
		if (res) {
			closeModal();
		} else {
			alert('Ошибка при удалении списка целей');
		}
	};

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Удаление списка целей
			</Title>
			<p className={element('text')}>
				Вы действительно хотите удалить список? Цели внутри списка и отзывы к ним также будут удалены из профиля.
			</p>
			<div className={element('btns-wrapper')}>
				<Button theme="blue-light" className={element('btn')} onClick={closeModal}>
					Отмена
				</Button>
				<Button theme="red" className={element('btn')} onClick={handleDeleteList}>
					Удалить
				</Button>
			</div>
		</section>
	);
};
