import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';
import './main-header-sliders-skeleton.scss';

interface MainHeaderSlidersSkeletonProps {
	count?: number;
}

export const MainHeaderSlidersSkeleton: FC<MainHeaderSlidersSkeletonProps> = (props) => {
	const {count = 3} = props;
	const [block, element] = useBem('main-header-sliders-skeleton');

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<Skeleton key={i} className={element('photo')} borderRadius={8} />
			))}
		</div>
	);
};
