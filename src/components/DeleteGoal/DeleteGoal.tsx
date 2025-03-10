import {FC} from 'react';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {IFuncModal} from '@/store/ModalStore';

import {Title} from '../Title/Title';
import './delete-goal.scss';

interface DeleteGoalProps {
	className?: string;
	closeModal: () => void;
	funcModal: IFuncModal;
}

export const DeleteGoal: FC<DeleteGoalProps> = (props) => {
	const {className, closeModal, funcModal} = props;

	const [block, element] = useBem('delete-goal', className);

	const handleDeleteGoal = async () => {
		const res = funcModal();
		if (res) {
			closeModal();
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
