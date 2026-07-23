import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Skeleton} from '@/shared/ui/Skeleton/Skeleton';
import '@/widgets/main-header/main-header-sliders-skeleton.scss';

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
