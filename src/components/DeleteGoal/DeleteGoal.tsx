import {FC} from 'react';

import {Title} from '../Title/Title';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import './delete-goal.scss';

interface DeleteGoalProps {
	className?: string;
	closeModal: () => void;
}

export const DeleteGoal: FC<DeleteGoalProps> = (props) => {
	const {className, closeModal} = props;

	const [block, element] = useBem('delete-goal', className);

	const handleDeleteGoal = async () => {
		// const res = await(); // TODO
		// if (res.success) {
		// 	closeModal();
		// } else {
		// 	alert('Ошибка при удалении списка целей');
		// }
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
				<Button theme="red" className={element('btn')} onClick={handleDeleteGoal}>
					Удалить
				</Button>
			</div>
		</section>
	);
};
