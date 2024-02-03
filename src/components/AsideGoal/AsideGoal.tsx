import {FC} from 'react';

import './aside-goal.scss';
import {Button} from '../Button/Button';
import {Line} from '../Line/Line';

import {useBem} from '@/hooks/useBem';

interface AsideProps {
	className?: string;
	title: string;
	image: string;
	added: boolean;
	code: string;
	done: boolean;
}

interface AsideGoalProps extends AsideProps {
	updateGoal: (code: string, operation: 'add' | 'delete' | 'mark', done?: boolean) => Promise<void>;
	isList?: never;
}

interface AsideListsProps extends AsideProps {
	updateGoal: (code: string, operation: 'add' | 'delete' | 'mark-all') => Promise<void>;
	isList: true;
}

export const AsideGoal: FC<AsideGoalProps | AsideListsProps> = (props) => {
	const {className, title, image, added, updateGoal, code, done, isList} = props;

	const [block, element] = useBem('aside-goal', className);

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
				{isList && added && (
					<Button theme="blue" onClick={() => updateGoal(code, 'mark-all')} icon="done" className={element('btn')}>
						Выполнить все цели
					</Button>
				)}
				{!added && (
					<Button onClick={() => updateGoal(code, 'add')} icon="plus" className={element('btn')} theme="blue">
						Добавить к себе
					</Button>
				)}
				{!isList && done && (
					<Button theme="blue-light" onClick={() => {}} icon="comment" className={element('btn')}>
						Написать отзыв
					</Button>
				)}
				{added && (
					<Button theme="blue-light" onClick={() => updateGoal(code, 'delete')} icon="trash" className={element('btn')}>
						Удалить
					</Button>
				)}
				<Line className={element('line')} />
				<Button
					theme="blue-light"
					icon="mount"
					onClick={() =>
						window.open(
							`https://telegram.me/share/url?url=${window.location.href}`,
							'sharer',
							'status=0,toolbar=0,width=650,height=500'
						)
					}
					// TODO Добавить действие
					className={element('btn')}
				>
					Поделиться
				</Button>
			</div>
		</aside>
	);
};
