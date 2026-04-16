import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';
import './global-goals-search-skeleton.scss';

interface GlobalGoalsSearchSkeletonProps {
	count?: number;
}

export const GlobalGoalsSearchSkeleton: FC<GlobalGoalsSearchSkeletonProps> = (props) => {
	const {count = 4} = props;
	const [block, element] = useBem('global-goals-search-skeleton');

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('item')}>
					<Skeleton className={element('image')} width={48} height={48} borderRadius={8} />
					<div className={element('text')}>
						<Skeleton width="70%" height={16} />
						<Skeleton width="50%" height={12} />
					</div>
				</div>
			))}
		</div>
	);
};
