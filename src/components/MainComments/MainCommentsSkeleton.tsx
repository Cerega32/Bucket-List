import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';
import './main-comments-skeleton.scss';

export const MainCommentsSkeleton: FC = () => {
	const [block, element] = useBem('main-comments-skeleton');

	return (
		<section className={block()}>
			<Skeleton className={element('title')} width={320} height={32} />
			<div className={element('row')}>
				{Array.from({length: 3}).map((_, i) => (
					<div key={i} className={element('card')}>
						<div className={element('head')}>
							<Skeleton className={element('circle')} circle width={44} height={44} />
							<div className={element('head-meta')}>
								<Skeleton width={130} height={14} />
								<Skeleton width={90} height={12} />
							</div>
						</div>
						<Skeleton height={14} />
						<Skeleton height={14} width="90%" />
						<Skeleton height={14} width="70%" />
						<Skeleton height={14} width="90%" />
						<Skeleton height={14} width="50%" />
					</div>
				))}
			</div>
		</section>
	);
};
