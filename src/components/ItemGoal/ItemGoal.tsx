import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './item-goal.scss';

interface ItemGoalProps {
	className?: string;
	img: string;
	title: string;
	text: string;
	vertical?: boolean;
}

export const ItemGoal: FC<ItemGoalProps> = (props) => {
	const {className, img, title, text, vertical} = props;

	const [block, element] = useBem('item-goal', className);

	return (
		<section className={block({vertical})}>
			<img src={img} alt={title} className={element('img')} />
			<div className={element('info')}>
				<h3 className={element('title')}>{title}</h3>
				Теги
				<p className={element('text')}>{text}</p>
			</div>
		</section>
	);
};
