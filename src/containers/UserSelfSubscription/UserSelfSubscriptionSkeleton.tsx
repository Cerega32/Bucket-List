import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './user-self-subscription-skeleton.scss';

export const UserSelfSubscriptionSkeleton: FC = () => {
	const [block, element] = useBem('user-self-subscription-skeleton');

	return (
		<div className={block()}>
			<div className={element('current')}>
				<Skeleton width="60%" height={20} />
				<Skeleton width="40%" height={14} />
			</div>
			<div className={element('plans')}>
				{Array.from({length: 2}).map((_, i) => (
					<div key={i} className={element('plan')}>
						<Skeleton width={120} height={24} />
						<Skeleton width="80%" height={14} />
						<div className={element('features')}>
							{Array.from({length: 9}).map((__, f) => (
								<Skeleton key={f} height={14} />
							))}
						</div>
						<Skeleton width="100%" height={40} borderRadius={8} />
					</div>
				))}
			</div>
			<Skeleton className={element('payment')} height={280} borderRadius={12} />
		</div>
	);
};
