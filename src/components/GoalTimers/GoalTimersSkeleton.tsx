import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';
import './goal-timers-skeleton.scss';

interface GoalTimersSkeletonProps {
	count?: number;
}

export const GoalTimersSkeleton: FC<GoalTimersSkeletonProps> = (props) => {
	const {count = 3} = props;
	const [block, element] = useBem('goal-timers-skeleton');

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={`skeleton-${i}`} className={element('card')}>
					<Skeleton className={element('image')} height={195} borderRadius={8} />
					<div className={element('content')}>
						<Skeleton width="75%" height={16} />
						<Skeleton width="50%" height={14} />
					</div>
					<div className={element('footer')}>
						<Skeleton width="40%" height={13} />
						<Skeleton width={50} height={13} />
					</div>
				</div>
			))}
		</div>
	);
};
