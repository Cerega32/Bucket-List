import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './regular-goal-history-skeleton.scss';

interface RegularGoalHistorySkeletonProps {
	className?: string;
	count?: number;
	withSettings?: boolean;
}

export const RegularGoalHistorySkeleton: FC<RegularGoalHistorySkeletonProps> = (props) => {
	const {className, count = 3, withSettings} = props;
	const [block, element] = useBem('regular-goal-history-skeleton', className);

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('card')}>
					<div className={element('header')}>
						<Skeleton circle width={40} height={40} />
						<div className={element('content')}>
							<Skeleton width="60%" height={16} borderRadius={4} />
							<Skeleton width="40%" height={13} borderRadius={4} />
						</div>
						<Skeleton width={72} height={22} borderRadius={6} />
					</div>
					{withSettings && (
						<div className={element('settings')}>
							<Skeleton height={16} borderRadius={4} />
							<Skeleton height={16} borderRadius={4} />
							<Skeleton height={16} borderRadius={4} />
						</div>
					)}
				</div>
			))}
		</div>
	);
};
