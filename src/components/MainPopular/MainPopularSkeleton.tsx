import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';
import './main-popular-skeleton.scss';

interface MainPopularSkeletonProps {
	count?: number;
}

export const MainPopularSkeleton: FC<MainPopularSkeletonProps> = (props) => {
	const {count = 11} = props;
	const [block, element] = useBem('main-popular-skeleton');

	return (
		<section className={block()}>
			<div className={element('header')}>
				<Skeleton width={320} height={40} borderRadius={10} />
				<Skeleton width={200} height={36} borderRadius={8} />
			</div>
			<div className={element('content')}>
				{Array.from({length: count}).map((_, i) => (
					<Skeleton key={i} className={element('card', {big: i < 3})} borderRadius={8} />
				))}
			</div>
		</section>
	);
};
