import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import {Tags} from '../Tags/Tags';
import {IShortGoal} from '@/typings/goal';
import './list-goals.scss';

interface ListGoalsProps {
	className?: string;
	goal: IShortGoal;
	vertical?: boolean;
}

export const ListGoals: FC<ListGoalsProps> = (props) => {
	const {className, goal, vertical} = props;

	const [block, element] = useBem('list-goals', className);

	return (
		<section className={block({vertical})}>
			<img src={goal.image} alt={goal.title} className={element('img')} />
			<div className={element('info')}>
				<h3 className={element('title')}>{goal.title}</h3>
				<Tags
					category={goal.category}
					complexity={goal.complexity}
					done={goal.totalCompleted}
					theme="light"
					className={element('tags')}
				/>
				<p className={element('text')}>{goal.shortDescription}</p>
			</div>
		</section>
	);
};
