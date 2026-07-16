import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';

import './lists-with-goal-skeleton.scss';

interface ListsWithGoalSkeletonProps {
	className?: string;
	count?: number;
}

export const ListsWithGoalSkeleton: FC<ListsWithGoalSkeletonProps> = (props) => {
	const {className, count = 2} = props;
	const [block, element] = useBem('lists-with-goal-skeleton', className);
	const {isScreenSmallMobile} = useScreenSize();

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('card', {horizontal: !isScreenSmallMobile})}>
					<Skeleton className={element('image')} borderRadius={8} />
					<div className={element('body')}>
						<div className={element('tags')}>
							<Skeleton width={80} height={22} borderRadius={10} />
							<Skeleton width={100} height={22} borderRadius={10} />
						</div>
						<Skeleton height={20} />
						<Skeleton height={20} width="70%" />
						<Skeleton height={12} />
						<Skeleton height={12} width="80%" />
						<Skeleton height={12} width="60%" />
					</div>
				</div>
			))}
		</div>
	);
};
