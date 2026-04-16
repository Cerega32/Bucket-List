import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';
import './goal-timers-skeleton.scss';

interface GoalTimersSkeletonProps {
	count?: number;
}

export const GoalTimersSkeleton: FC<GoalTimersSkeletonProps> = (props) => {
	const {count = 2} = props;
	const [block, element] = useBem('goal-timers-skeleton');

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('card')}>
					<Skeleton className={element('image')} width={96} height={96} borderRadius={8} />
					<div className={element('content')}>
						<Skeleton width="80%" height={18} />
						<div className={element('info')}>
							<Skeleton width="60%" height={14} />
							<Skeleton width="45%" height={14} />
						</div>
						<Skeleton width={140} height={36} borderRadius={8} />
					</div>
				</div>
			))}
		</div>
	);
};
