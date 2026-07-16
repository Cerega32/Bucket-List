import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import './user-map-page-skeleton.scss';

export const UserMapPageSkeleton: FC = () => {
	const [block, element] = useBem('user-map-page-skeleton');

	return (
		<div className={block()}>
			<Title tag="h2" className={element('title')}>
				Мои карты
			</Title>
			<Skeleton className={element('map')} borderRadius={12} />
		</div>
	);
};
