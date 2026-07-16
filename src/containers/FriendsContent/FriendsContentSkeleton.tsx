import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './friends-content-skeleton.scss';

interface FriendsContentSkeletonProps {
	count?: number;
	withActions?: boolean;
}

export const FriendsContentSkeleton: FC<FriendsContentSkeletonProps> = (props) => {
	const {count = 5, withActions} = props;
	const [block, element] = useBem('friends-content-skeleton');

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('card')}>
					<Skeleton circle width={56} height={56} />
					<div className={element('info')}>
						<Skeleton width="60%" height={18} />
						<Skeleton width="40%" height={14} />
					</div>
					{withActions ? (
						<div className={element('actions')}>
							<Skeleton width={100} height={32} borderRadius={8} />
							<Skeleton width={100} height={32} borderRadius={8} />
						</div>
					) : (
						<Skeleton className={element('action')} width={120} height={36} borderRadius={8} />
					)}
				</div>
			))}
		</div>
	);
};
