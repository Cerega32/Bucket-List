import {FC} from 'react';

import {Line} from '../Line/Line';
import {Progress} from '../Progress/Progress';
import {ProgressCategory} from '../ProgressCategory/ProgressCategory';

import {useBem} from '@/hooks/useBem';
import './info-100-goals.scss';

interface Info100GoalsProps {
	className?: string;
	totalAddedEasy: number;
	totalAddedMedium: number;
	totalAddedHard: number;
	totalCompletedEasy: number;
	totalCompletedMedium: number;
	totalCompletedHard: number;
}

export const Info100Goals: FC<Info100GoalsProps> = (props) => {
	const {className, totalCompletedEasy, totalAddedEasy, totalAddedHard, totalAddedMedium, totalCompletedHard, totalCompletedMedium} =
		props;

	const [block, element] = useBem('info-100-goals', className);

	return (
		<section className={block()}>
			<div className={element('wrapper')}>
				<ProgressCategory complexity="easy" done={totalCompletedEasy} all={totalAddedEasy} />
				<Line vertical height={-16} />
				<ProgressCategory complexity="medium" done={totalCompletedMedium} all={totalAddedMedium} />
				<Line vertical height={-16} />
				<ProgressCategory complexity="hard" done={totalCompletedHard} all={totalAddedHard} />
			</div>
			{totalAddedEasy + totalAddedHard + totalAddedMedium > 0 && (
				<>
					<Line />
					<div className={element('score')}>
						<p className={element('text')}>Общий прогресс:</p>
						<Progress
							done={totalCompletedEasy + totalCompletedHard + totalCompletedMedium}
							all={totalAddedEasy + totalAddedHard + totalAddedMedium}
							goal
						/>
					</div>
				</>
			)}
		</section>
	);
};
