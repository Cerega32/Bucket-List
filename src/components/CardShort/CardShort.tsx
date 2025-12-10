import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {IShortGoal} from '@/typings/goal';

import {Tags} from '../Tags/Tags';
import {Title} from '../Title/Title';

import './card-short.scss';

interface CardShortProps {
	className?: string;
	goal: IShortGoal;
}

export const CardShort: FC<CardShortProps> = (props) => {
	const {className, goal} = props;

	const [block, element] = useBem('card-short', className);

	return (
		<section className={block()}>
			<Link to={`/goals/${goal.code}`} className={element('link')}>
				<img src={goal.image} alt={goal.title} className={element('img')} />
				<div className={element('info')}>
					<Title tag="h3" className={element('title')}>
						{goal.title}
					</Title>
					<div className={element('tags-wrapper')}>
						<Tags
							complexity={goal.complexity}
							added={goal.totalAdded}
							estimatedTime={goal.estimatedTime}
							theme="integrate"
							className={element('tags')}
							showSeparator
						/>
					</div>
				</div>
			</Link>
		</section>
	);
};
