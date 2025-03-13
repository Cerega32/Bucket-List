import {FC} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {IGoal} from '@/typings/goal';

interface GoalSearchItemProps {
	goal: IGoal;
	onAdd: (goal: IGoal) => void;
}

export const GoalSearchItem: FC<GoalSearchItemProps> = ({goal, onAdd}) => {
	const [block, element] = useBem('goal-search-item');

	return (
		<div className={block()}>
			<div className={element('content')}>
				<div className={element('image-container')}>
					{goal.image ? (
						<img src={goal.image} alt={goal.title} className={element('image')} />
					) : (
						<div className={element('no-image')}>
							<Svg icon="mount" />
						</div>
					)}
				</div>
				<div className={element('info')}>
					<h4 className={element('title')}>{goal.title}</h4>
					<p className={element('complexity')}>{goal.complexity}</p>
					<p className={element('description')}>{goal.shortDescription}</p>
				</div>
			</div>
			<button type="button" className={element('add-btn')} onClick={() => onAdd(goal)} aria-label="Добавить цель">
				<Svg icon="plus" />
			</button>
		</div>
	);
};
