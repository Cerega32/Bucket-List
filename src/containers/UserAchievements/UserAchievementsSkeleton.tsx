import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './user-achievements-skeleton.scss';

interface UserAchievementsSkeletonProps {
	className?: string;
	count?: number;
}

export const UserAchievementsSkeleton: FC<UserAchievementsSkeletonProps> = (props) => {
	const {className, count = 8} = props;
	const [block, element] = useBem('user-achievements-skeleton', className);

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('card')}>
					<Skeleton width={40} height={40} className={element('card-img')} />
					<div key={i} className={element('card-text')}>
						<Skeleton width="80%" height={18} />
						<Skeleton width="90%" height={12} />
						<Skeleton width="70%" height={12} />
					</div>
				</div>
			))}
		</div>
	);
};
