import {FC} from 'react';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {IFuncModal} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';

import {Title} from '../Title/Title';

import './confirm-execution-all-goal.scss';
// import {markAllGoalsFromList} from '@/utils/api/post/markAllGoalsFromList';

interface ConfirmExecutionAllGoalProps {
	className?: string;
	closeModal: () => void;
	funcModal: IFuncModal;
}

export const ConfirmExecutionAllGoal: FC<ConfirmExecutionAllGoalProps> = (props) => {
	const {className, closeModal, funcModal} = props;

	const [block, element] = useBem('confirm-execution-all-goal', className);

	const handleMarkAllGoalsFromList = async () => {
		try {
			const res = funcModal();
			if (res) {
				closeModal();
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Упс',
				message: 'Что-то пошло не так',
			});
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
				<Button theme="blue-light" className={element('btn')} onClick={closeModal}>
					Отмена
				</Button>
				<Button theme="blue" className={element('btn')} onClick={handleMarkAllGoalsFromList}>
					Выполнить
				</Button>
			</div>
		</section>
	);
};
