import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {getGoalTimer, TimerInfo} from '@/utils/api/get/getGoalTimer';

import './aside-goal.scss';

import {Button} from '../Button/Button';
import {GoalTimer} from '../GoalTimer/GoalTimer';
import {Line} from '../Line/Line';

interface AsideProps {
	className?: string;
	title: string;
	image: string;
	added: boolean;
	code: string;
	done: boolean;
}

interface AsideGoalProps extends AsideProps {
	updateGoal: (code: string, operation: 'add' | 'delete' | 'mark', done?: boolean) => Promise<void | boolean>;
	isList?: never;
	openAddReview: () => void;
	editGoal?: () => void;
	canEdit?: boolean;
}

export interface AsideListsProps extends AsideProps {
	updateGoal: (code: string, operation: 'add' | 'delete' | 'mark-all') => Promise<void | boolean>;
	isList: true;
	openAddReview?: never;
	editGoal?: never;
	canEdit?: never;
}

export const AsideGoal: FC<AsideGoalProps | AsideListsProps> = (props) => {
	const {className, title, image, added, updateGoal, code, done, isList, openAddReview, editGoal, canEdit} = props;
	const [timer, setTimer] = useState<TimerInfo | null>(null);

	const [block, element] = useBem('aside-goal', className);

	const {setIsOpen, setWindow, setFuncModal} = ModalStore;

	// Загрузка информации о таймере
	useEffect(() => {
		const loadTimer = async () => {
			if (added && !isList) {
				const response = await getGoalTimer(code);
				if (response.success && response.data?.timer) {
					// Данные таймера уже в нужном формате, используем напрямую
					setTimer(response.data.timer);
				} else {
					// Сбрасываем таймер, если его нет или произошла ошибка
					setTimer(null);
				}
			}
		};

		loadTimer();
	}, [code, added, isList]);

	const handleTimerUpdate = (updatedTimer: TimerInfo | null) => {
		setTimer(updatedTimer);
	};

	const openMarkAll = () => {
		setWindow('confirm-execution-all-goal');
		setIsOpen(true);
		if (isList) {
			setFuncModal(() => updateGoal(code, 'mark-all'));
		}
	};

	const deleteGoal = () => {
		if (isList) {
			setWindow('delete-goal');
		} else {
			setWindow('delete-goal');
		}
		setIsOpen(true);
		setFuncModal(() => updateGoal(code, 'delete'));
	};

	return (
		<aside className={block()}>
			<img src={image} alt={title} className={element('image')} />
			<div className={element('info')}>
				{!isList && added && (
					<Button
						theme={done ? 'green' : 'blue'}
						onClick={() => updateGoal(code, 'mark', done)}
						icon="plus"
						className={element('btn', {done: true})}
						hoverContent={done ? 'Отменить выполнение' : ''}
						hoverIcon={done ? 'cross' : ''}
					>
						{done ? 'Выполнено' : 'Выполнить'}
					</Button>
				)}
				{isList && added && !done && (
					<Button theme="blue" onClick={openMarkAll} icon="done" className={element('btn')}>
						Выполнить все цели
					</Button>
				)}
				{!added && (
					<Button onClick={() => updateGoal(code, 'add')} icon="plus" className={element('btn')} theme="blue">
						Добавить к себе
					</Button>
				)}
				{!isList && done && (
					<Button theme="blue-light" onClick={openAddReview} icon="comment" className={element('btn')}>
						Написать отзыв
					</Button>
				)}
				{added && (
					<Button theme="blue-light" onClick={deleteGoal} icon="trash" className={element('btn')}>
						Удалить
					</Button>
				)}
				{canEdit && editGoal && (
					<Button theme="blue-light" onClick={editGoal} icon="edit" className={element('btn')}>
						Редактировать
					</Button>
				)}

				{/* Показываем таймер, если цель добавлена и не является списком */}
				{added && !isList && (
					<>
						<Line className={element('line')} />
						<GoalTimer timer={timer} goalCode={code} onTimerUpdate={handleTimerUpdate} />
					</>
				)}

				<Line className={element('line')} />
				<Button
					theme="blue-light"
					icon="mount"
					onClick={() => {
						window.open(
							`https://telegram.me/share/url?url=${window.location.href}`,
							'sharer',
							'status=0,toolbar=0,width=650,height=500'
						);
					}}
					className={element('btn')}
				>
					Поделиться
				</Button>
			</div>
		</aside>
	);
};
