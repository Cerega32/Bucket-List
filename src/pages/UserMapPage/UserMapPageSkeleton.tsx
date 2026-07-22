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

			<div className={element('switch')} aria-hidden="true">
				<Skeleton className={element('switch-tab')} width={110} height={32} borderRadius={8} />
				<Skeleton className={element('switch-tab')} width={120} height={32} borderRadius={8} />
			</div>

			<div className={element('map-section')}>
				<Skeleton className={element('map')} borderRadius={12} />
			</div>
		</div>
	);
};
