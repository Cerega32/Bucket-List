import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './news-page-skeleton.scss';

interface NewsPageSkeletonProps {
	className?: string;
	cardsCount?: number;
}

export const NewsPageSkeleton: FC<NewsPageSkeletonProps> = (props) => {
	const {className, cardsCount = 5} = props;
	const [block, element] = useBem('news-page-skeleton', className);

	return (
		<div className={block()}>
			<div className={element('list')}>
				{Array.from({length: cardsCount}).map((_, i) => (
					<article key={i} className={element('card')}>
						<Skeleton className={element('image')} borderRadius={8} />
						<div className={element('content')}>
							<Skeleton className={element('title')} height={28} width="80%" />
							<Skeleton height={14} />
							<Skeleton height={14} width="90%" />
							<div className={element('meta')}>
								<Skeleton width={140} height={12} />
								<div className={element('meta-right')}>
									<Skeleton width={80} height={12} />
									<Skeleton width={100} height={12} />
								</div>
							</div>
						</div>
					</article>
				))}
			</div>
		</div>
	);
};
