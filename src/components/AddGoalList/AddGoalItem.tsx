import {FC} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {IGoal} from '@/typings/goal';

interface AddGoalItemProps {
	goal: IGoal;
	onRemove: (goalId: number) => void;
}

export const AddGoalItem: FC<AddGoalItemProps> = ({goal, onRemove}) => {
	const [block, element] = useBem('add-goal-item');

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
				</div>
			</div>
			<button type="button" className={element('remove-btn')} onClick={() => onRemove(goal.id)} aria-label="Удалить цель">
				<Svg icon="cross" />
			</button>
		</div>
	);
};
