import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';

interface FolderRulesManagerSkeletonProps {
	className?: string;
	count?: number;
}

export const FolderRulesManagerSkeleton: FC<FolderRulesManagerSkeletonProps> = (props) => {
	const {className, count = 3} = props;
	const [block, element] = useBem('folder-rules-manager', className);

	return (
		<div className={block()}>
			<div className={element('rules')}>
				<div className={element('header')}>
					<Skeleton width={200} height={24} />
					<Skeleton width={160} height={32} />
				</div>
				{Array.from({length: count}).map((_, i) => (
					<div key={i} className={element('rule-skeleton')}>
						<div className={element('rule-skeleton-info')}>
							<Skeleton width="70%" height={18} />
							<div className={element('rule-skeleton-details')}>
								<Skeleton width={160} height={24} borderRadius={6} />
							</div>
						</div>
						<div className={element('rule-skeleton-actions')}>
							<Skeleton width={130} height={32} borderRadius={8} />
							<Skeleton width={130} height={32} borderRadius={8} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
