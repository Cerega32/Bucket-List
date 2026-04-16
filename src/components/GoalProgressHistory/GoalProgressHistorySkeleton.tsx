import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './goal-progress-history-skeleton.scss';

interface GoalProgressHistorySkeletonProps {
	className?: string;
	count?: number;
}

export const GoalProgressHistorySkeleton: FC<GoalProgressHistorySkeletonProps> = (props) => {
	const {className, count = 4} = props;
	const [block, element] = useBem('goal-progress-history-skeleton', className);

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('item')}>
					<Skeleton width={80} height={14} borderRadius={4} />
					<div className={element('note')}>
						<Skeleton width="100%" height={14} borderRadius={4} />
						<Skeleton width="70%" height={14} borderRadius={4} />
					</div>
					<Skeleton width={56} height={24} borderRadius={6} />
				</div>
			))}
		</div>
	);
};
