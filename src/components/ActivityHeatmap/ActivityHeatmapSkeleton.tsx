import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';
import './activity-heatmap-skeleton.scss';

export const ActivityHeatmapSkeleton: FC = () => {
	const [block, element] = useBem('activity-heatmap-skeleton');

	return (
		<div className={block()}>
			<div className={element('stats')}>
				{Array.from({length: 9}).map((_, i) => (
					<div key={i} className={element('stat-item')}>
						<Skeleton width={40} height={22} />
						<Skeleton width={100} height={12} />
					</div>
				))}
			</div>

			<div className={element('container')}>
				<div className={element('months')}>
					{Array.from({length: 12}).map((_, i) => (
						<Skeleton key={i} height={12} />
					))}
				</div>

				<Skeleton className={element('grid')} borderRadius={6} />

				<div className={element('legend')}>
					<div className={element('legend-section')}>
						<Skeleton width={100} height={12} />
						{Array.from({length: 5}).map((_, i) => (
							<Skeleton key={i} width={14} height={14} borderRadius={3} />
						))}
						<Skeleton width={60} height={12} />
					</div>
					<div className={element('legend-section')}>
						<Skeleton width={120} height={12} />
					</div>
				</div>
			</div>
		</div>
	);
};
