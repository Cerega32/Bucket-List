import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './user-100-goals-skeleton.scss';

interface User100GoalsSkeletonProps {
	className?: string;
	cardsPerSection?: number;
	withStats?: boolean;
}

export const User100GoalsSkeleton: FC<User100GoalsSkeletonProps> = (props) => {
	const {className, cardsPerSection = 11, withStats = true} = props;
	const [block, element] = useBem('user-100-goals-skeleton', className);

	return (
		<div className={block()}>
			{withStats && <Skeleton className={element('stats')} height={130} borderRadius={12} />}

			{(['easy', 'medium', 'hard'] as const).map((complexity) => (
				<section key={complexity} className={element('section')}>
					<div className={element('section-title')}>
						<Skeleton circle width={22} height={22} />
						<Skeleton width={200} height={24} />
					</div>
					<div className={element('cards')}>
						{Array.from({length: cardsPerSection}).map((_, i) => (
							<Skeleton key={i} className={element('card')} borderRadius={8} />
						))}
					</div>
				</section>
			))}
		</div>
	);
};
