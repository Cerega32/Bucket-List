import {FC} from 'react';

import {refreshHeaderGoalCounts} from '@/entities/goal/lib/refreshHeaderGoalCounts';
import {useBem} from '@/shared/lib/hooks/useBem';
import {IFuncModal} from '@/shared/model/ModalStore';
import {Button} from '@/shared/ui/Button/Button';
import {Title} from '@/shared/ui/Title/Title';
import '@/features/delete-goal/delete-goal.scss';

interface DeleteGoalProps {
	className?: string;
	closeModal: () => void;
	funcModal: IFuncModal;
}

export const DeleteGoal: FC<DeleteGoalProps> = (props) => {
	const {className, closeModal, funcModal} = props;

	const [block, element] = useBem('delete-goal', className);

	const handleDeleteGoal = async () => {
		const raw = funcModal();
		const ok = raw instanceof Promise ? await raw : raw;
		if (ok === false) {
			return;
		}
		try {
			await refreshHeaderGoalCounts();
		} catch (e) {
			console.error(e);
		}
		closeModal();
	};

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Удаление цели
			</Title>
			<p className={element('text')}>Вы действительно хотите удалить цель? Оставленное впечатление будет удалено вместе с целью.</p>
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
