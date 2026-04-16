import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './user-showcase-skeleton.scss';

interface UserShowcaseSkeletonProps {
	className?: string;
}

export const UserShowcaseSkeleton: FC<UserShowcaseSkeletonProps> = (props) => {
	const {className} = props;
	const [block, element] = useBem('user-showcase-skeleton', className);

	return (
		<div className={block()}>
			<div className={element('comments')}>
				<Skeleton width={200} height={24} />
				<div className={element('photos')}>
					{Array.from({length: 5}).map((_, i) => (
						<Skeleton key={i} width={160} height={160} borderRadius={8} className={element('photo')} />
					))}
				</div>
				{Array.from({length: 3}).map((_, i) => (
					<div key={i} className={element('comment-card')}>
						<div className={element('comment-head')}>
							<Skeleton circle width={40} height={40} />
							<div className={element('comment-meta')}>
								<Skeleton width={160} height={14} />
								<Skeleton width={80} height={12} />
							</div>
						</div>
						<Skeleton height={14} />
						<Skeleton height={14} width="85%" />
						<Skeleton height={14} width="60%" />
					</div>
				))}
			</div>

			<aside className={element('sidebar')}>
				<div className={element('sidebar-title')}>
					<Skeleton width={140} height={24} />
					<Skeleton width={120} height={32} borderRadius={8} />
				</div>
				<Skeleton className={element('stats')} height={320} borderRadius={12} />

				<div className={element('sidebar-title')}>
					<Skeleton width={160} height={24} />
					<Skeleton width={120} height={32} borderRadius={8} />
				</div>
				{Array.from({length: 3}).map((_, i) => (
					<Skeleton key={i} className={element('achievement')} height={96} borderRadius={8} />
				))}
			</aside>
		</div>
	);
};
