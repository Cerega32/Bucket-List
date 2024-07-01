import {FC} from 'react';

import {Title} from '../Title/Title';

import {AsideListsProps} from '@/components/AsideGoal/AsideGoal';
import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import './confirm-execution-all-goal.scss';
// import {markAllGoalsFromList} from '@/utils/api/post/markAllGoalsFromList';

interface ConfirmExecutionAllGoalProps extends AsideListsProps {
	className?: string;
	closeModal: () => void;
	code: string;
}

export const ConfirmExecutionAllGoal: FC<ConfirmExecutionAllGoalProps> = (props) => {
	const {className, closeModal, code, updateGoal} = props;

	const [block, element] = useBem('confirm-execution-all-goal ', className);

	const handleMarkAllGoalsFromList = async () => {
		try {
			await updateGoal(code, 'mark-all');
			closeModal();
		} catch (error) {
			alert('Что-то пошло не так');
		}
	};

	return (
		<section className={block()}>
			<Title tag="h2" className={element('title')}>
				Выполнение всех целей списка
			</Title>
			<p className={element('text')}>
				Вы действительно хотите отметить все цели выполнеными? Отменить это действие можно только вручную по каждой цели.
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
