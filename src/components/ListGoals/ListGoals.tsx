import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './list-goals.scss';

interface ListGoalsProps {
	className?: string;
	img: string;
	title: string;
	text: string;
}

export const ListGoals: FC<ListGoalsProps> = (props) => {
	const {className, img, title, text} = props;

	const [block, element] = useBem('list-goals', className);

	return (
		<section className={block()}>
			<img src={img} alt={title} className={element('img')} />
			<div className={element('info')}>
				<h3 className={element('title')}>{title}</h3>
				Теги
				<p className={element('text')}>{text}</p>
			</div>
		</section>
	);
};
