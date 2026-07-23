import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Skeleton} from '@/shared/ui/Skeleton/Skeleton';

import '@/features/goal-folder-manager/goal-folder-manager-skeleton.scss';

interface GoalFolderManagerSkeletonProps {
	count?: number;
}

export const GoalFolderManagerSkeleton: FC<GoalFolderManagerSkeletonProps> = (props) => {
	const {count = 6} = props;
	const [block, element] = useBem('goal-folder-manager-skeleton');

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('folder')}>
					<Skeleton className={element('folder-badge')} width={40} height={40} borderRadius={6} />
					<div className={element('folder-body')}>
						<Skeleton width="70%" height={16} />
						<Skeleton width="90%" height={12} />
						<Skeleton width="60%" height={12} />
					</div>
				</div>
			))}
		</div>
	);
};
