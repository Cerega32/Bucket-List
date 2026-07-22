import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './folder-selector-skeleton.scss';

interface FolderSelectorSkeletonProps {
	count?: number;
}

export const FolderSelectorSkeleton: FC<FolderSelectorSkeletonProps> = (props) => {
	const {count = 4} = props;
	const [block, element] = useBem('folder-selector-skeleton');

	return (
		<div className={block()} aria-busy="true" aria-label="Загрузка папок">
			<div className={element('header')}>
				<Skeleton width="75%" height={24} borderRadius={6} />
				<Skeleton width="55%" height={14} borderRadius={4} />
			</div>
			<div className={element('folders')}>
				{Array.from({length: count}).map((_, i) => (
					<div key={i} className={element('folder')}>
						<div className={element('folder-info')}>
							<Skeleton width="70%" height={16} borderRadius={4} />
							<Skeleton width="90%" height={12} borderRadius={4} />
							<Skeleton width="40%" height={12} borderRadius={4} />
						</div>
						<Skeleton className={element('folder-radio')} width={16} height={16} circle />
					</div>
				))}
			</div>
			<div className={element('actions')}>
				<Skeleton width={160} height={40} borderRadius={8} />
			</div>
		</div>
	);
};
