import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';

import './goal-skeleton.scss';

interface GoalSkeletonProps {
	className?: string;
}

export const GoalSkeleton: FC<GoalSkeletonProps> = (props) => {
	const {className} = props;
	const [block, element] = useBem('goal-skeleton', className);
	const {isScreenMobile, isScreenSmallTablet} = useScreenSize();
	const isMobile = isScreenMobile || isScreenSmallTablet;

	return (
		<div className={block()}>
			<div className={element('header')}>
				{isMobile && <Skeleton className={element('header-image-mobile')} borderRadius={8} />}
				<div className={element('header-wrapper')}>
					<Skeleton height={40} width="80%" />
					<div className={element('header-tags')}>
						<Skeleton width={96} height={28} borderRadius={14} />
						<Skeleton width={120} height={28} borderRadius={14} />
						<Skeleton width={80} height={28} borderRadius={14} />
					</div>
				</div>
			</div>

			<div className={element('wrapper')}>
				<aside className={element('aside')}>
					<Skeleton className={element('aside-image')} borderRadius={8} />
					<div className={element('aside-info')}>
						<Skeleton height={40} borderRadius={8} />
						<Skeleton height={40} borderRadius={8} />
						<Skeleton height={40} borderRadius={8} />
					</div>
				</aside>

				<div className={element('content')}>
					<div className={element('description')}>
						<div className={element('description-wrapper')}>
							<Skeleton height={14} />
							<Skeleton height={14} />
							<Skeleton height={14} width="85%" />
							<Skeleton height={14} width="70%" />
						</div>

						<div className={element('stats')}>
							{Array.from({length: 2}).map((_, i) => (
								<div className={element('stats-info')} key={i}>
									<Skeleton width={120} height={14} />
									<Skeleton width={80} height={20} />
								</div>
							))}
						</div>
					</div>

					<div className={element('impressions')}>
						<div className={element('impressions-gallery')}>
							{Array.from({length: 3}).map((_, i) => (
								<Skeleton key={i} className={element('impressions-photo')} borderRadius={8} />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
