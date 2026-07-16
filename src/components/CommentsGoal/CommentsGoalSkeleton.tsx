import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './comments-goal-skeleton.scss';

interface CommentsGoalSkeletonProps {
	className?: string;
	count?: number;
}

export const CommentsGoalSkeleton: FC<CommentsGoalSkeletonProps> = (props) => {
	const {className, count = 2} = props;
	const [block, element] = useBem('comments-goal-skeleton', className);

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<article key={i} className={element('card')}>
					<div className={element('head')}>
						<Skeleton circle width={44} height={44} />
						<div className={element('head-meta')}>
							<Skeleton width={160} height={14} />
							<div className={element('head-info')}>
								<Skeleton width={80} height={12} />
								<Skeleton width={90} height={18} borderRadius={10} />
							</div>
						</div>
					</div>
					<Skeleton height={14} />
					<Skeleton height={14} width="90%" />
					<Skeleton height={14} width="70%" />
					<div className={element('footer')}>
						<Skeleton width={72} height={72} borderRadius={8} />
						<Skeleton width={72} height={72} borderRadius={8} />
						<Skeleton width={72} height={72} borderRadius={8} />
					</div>
					<div className={element('footer')}>
						<Skeleton width={56} height={24} borderRadius={8} />
						<Skeleton width={56} height={24} borderRadius={8} />
					</div>
				</article>
			))}
		</div>
	);
};
