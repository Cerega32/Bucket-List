import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './aside-goal.scss';
import {Button} from '../Button/Button';

interface AsideGoalProps {
	className?: string;
	title: string;
	text: string;
	image: string;
	onAdded: () => void;
	added: boolean;
}

export const AsideGoal: FC<AsideGoalProps> = (props) => {
	const {className, title, text, image, onAdded, added} = props;

	const [block, element] = useBem('aside-goal', className);

	return (
		<aside className={block()}>
			<img src={image} alt={title} className={element('image')} />
			<div className={element('info')}>
				{added ? (
					<Button
						theme="blue"
						onClick={() => {}}
						icon="plus"
						className={element('btn')}
					>
						Добавлено
					</Button>
				) : (
					<Button
						theme="blue"
						onClick={onAdded}
						icon="plus"
						className={element('btn')}
					>
						Добавить к себе
					</Button>
				)}
				<Button
					theme="blue-light"
					type="Link"
					icon="mount"
					onClick={() => {}}
					className={element('last-btn')}
				>
					Подробнее
				</Button>
				<p>{text}</p>
			</div>
		</aside>
	);
};
