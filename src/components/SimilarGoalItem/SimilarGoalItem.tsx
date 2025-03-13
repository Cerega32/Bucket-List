import {FC, KeyboardEvent} from 'react';

import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {IGoal} from '@/typings/goal';
import './similar-goal-item.scss';

interface SimilarGoalItemProps {
	goal: IGoal;
	onSelect: (goal: IGoal) => void;
}

export const SimilarGoalItem: FC<SimilarGoalItemProps> = ({goal, onSelect}) => {
	const [block, element] = useBem('similar-goal-item');

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onSelect(goal);
		}
	};

	return (
		<div className={block()} onClick={() => onSelect(goal)} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
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
			<div className={element('select-icon')}>
				<Svg icon="arrow--right" />
			</div>
		</div>
	);
};
