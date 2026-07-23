import {FC, KeyboardEvent} from 'react';

import {getComplexity} from '@/entities/goal/lib/complexity';
import {IGoal} from '@/entities/goal/model/types';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Tag} from '@/shared/ui/Tag/Tag';
import {Title} from '@/shared/ui/Title/Title';

import '@/entities/goal/ui/SimilarGoalItem/similar-goal-item.scss';

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
				<Title tag="h4" className={element('title')}>
					{goal.title}
				</Title>
				<Tag className={element('complexity')} text={getComplexity[goal.complexity]} icon={goal.complexity} theme="light" />
				<p className={element('description')}>{goal.shortDescription}</p>
			</div>
		</div>
	);
};
