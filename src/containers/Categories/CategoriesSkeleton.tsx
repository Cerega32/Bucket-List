import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './categories-skeleton.scss';

interface CategoriesSkeletonProps {
	count?: number;
}

export const CategoriesSkeleton: FC<CategoriesSkeletonProps> = (props) => {
	const {count = 6} = props;
	const [block, element] = useBem('categories-skeleton');

	return (
		<div className={block()}>
			<Skeleton className={element('title')} width={280} height={32} />
			<div className={element('grid')}>
				{Array.from({length: count}).map((_, i) => (
					<div key={i} className={element('card')}>
						<Skeleton className={element('icon')} width={56} height={56} borderRadius={8} />
						<div className={element('text')}>
							<Skeleton width="80%" height={18} />
							<Skeleton width="50%" height={14} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
