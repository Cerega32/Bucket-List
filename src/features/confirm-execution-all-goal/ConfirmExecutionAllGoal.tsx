import {FC, useState} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {IFuncModal} from '@/shared/model/ModalStore';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {Button} from '@/shared/ui/Button/Button';
import {Title} from '@/shared/ui/Title/Title';

import '@/features/confirm-execution-all-goal/confirm-execution-all-goal.scss';

interface ConfirmExecutionAllGoalProps {
	className?: string;
	closeModal: () => void;
	funcModal: IFuncModal;
}

export const ConfirmExecutionAllGoal: FC<ConfirmExecutionAllGoalProps> = (props) => {
	const {className, closeModal, funcModal} = props;
	const [isMarking, setIsMarking] = useState(false);

	const [block, element] = useBem('confirm-execution-all-goal', className);

	const handleMarkAllGoalsFromList = async () => {
		if (isMarking) return;
		setIsMarking(true);
		try {
			const raw = funcModal();
			const ok = raw instanceof Promise ? await raw : raw;
			if (ok === false) {
				return;
			}
			closeModal();
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Упс',
				message: 'Что-то пошло не так',
			});
		} finally {
			setIsMarking(false);
		}
	};

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Выполнение всех целей списка
			</Title>
			<p className={element('text')}>
				Вы действительно хотите отметить все цели выполненными? Отменить это действие можно только вручную по каждой цели.
			</p>
			<div className={element('btns-wrapper')}>
				<Button theme="blue-light" className={element('btn')} onClick={closeModal} disabled={isMarking}>
					Отмена
				</Button>
				<Button
					theme="blue"
					className={element('btn')}
					onClick={handleMarkAllGoalsFromList}
					disabled={isMarking}
					loading={isMarking}
					loadingText="Выполнение..."
				>
					Выполнить
				</Button>
			</div>
		</section>
	);
};
