import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './user-self-dashboard-skeleton.scss';

export const UserSelfDashboardSkeleton: FC = () => {
	const [block, element] = useBem('user-self-dashboard-skeleton');

	return (
		<div className={block()}>
			<div className={element('info-wrapper')}>
				<div className={element('info-group')}>
					{Array.from({length: 3}).map((_, i) => (
						<div key={i} className={element('info-card')}>
							<Skeleton width="80%" height={14} />
							<Skeleton width={80} height={28} />
						</div>
					))}
				</div>
				<Skeleton className={element('chart')} borderRadius={12} />
				<Skeleton className={element('chart')} borderRadius={12} />
				<Skeleton className={element('chart')} borderRadius={12} />
			</div>
		</div>
	);
};
