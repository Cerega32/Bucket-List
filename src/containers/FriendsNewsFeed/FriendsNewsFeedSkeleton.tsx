import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './friends-news-feed-skeleton.scss';

interface FriendsNewsFeedSkeletonProps {
	className?: string;
	count?: number;
}

export const FriendsNewsFeedSkeleton: FC<FriendsNewsFeedSkeletonProps> = (props) => {
	const {className, count = 5} = props;
	const [block, element] = useBem('friends-news-feed-skeleton', className);

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<article key={i} className={element('card')}>
					<div className={element('card-main')}>
						<Skeleton className={element('icon')} borderRadius={8} />
						<div className={element('content')}>
							<Skeleton className={element('title')} height={16} width="85%" />
							<Skeleton height={12} width="55%" />
							<Skeleton className={element('date')} height={12} width={80} />
						</div>
					</div>
					<Skeleton className={element('like')} width={48} height={32} borderRadius={8} />
				</article>
			))}
		</div>
	);
};
