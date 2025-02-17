import {FC} from 'react';

import {Title} from '../Title/Title';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import './delete-goal.scss';
import {IFuncModal} from '@/store/ModalStore';

interface DeleteGoalProps {
	className?: string;
	closeModal: () => void;
	funcModal: IFuncModal;
}

export const DeleteGoal: FC<DeleteGoalProps> = (props) => {
	const {className, closeModal, funcModal} = props;

	const [block, element] = useBem('delete-goal', className);

	const handleDeleteGoal = async () => {
		const res = funcModal(); // TODO
		if (res) {
			closeModal();
		} else {
			alert('Ошибка при удалении цели');
		}
	};

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Удаление цели
			</Title>
			<p className={element('text')}>Вы действительно хотите удалить цель? Написанный отзыв будет будет удалён вместе с целью.</p>
			<div className={element('btns-wrapper')}>
				<Button theme="blue-light" className={element('btn')} onClick={closeModal}>
					Отмена
				</Button>
				<Button theme="red" className={element('btn')} onClick={handleDeleteGoal}>
					Удалить
				</Button>
			</div>
		</section>
	);
};
