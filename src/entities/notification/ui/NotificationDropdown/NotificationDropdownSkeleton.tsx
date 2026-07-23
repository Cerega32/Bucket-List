import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Skeleton} from '@/shared/ui/Skeleton/Skeleton';
import '@/entities/notification/ui/NotificationDropdown/notification-dropdown-skeleton.scss';

interface NotificationDropdownSkeletonProps {
	className?: string;
	count?: number;
}

export const NotificationDropdownSkeleton: FC<NotificationDropdownSkeletonProps> = (props) => {
	const {className, count = 3} = props;
	const [block, element] = useBem('notification-dropdown-skeleton', className);

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('item')}>
					<Skeleton className={element('avatar')} circle width={40} height={40} />
					<div className={element('content')}>
						<Skeleton width="60%" height={14} />
						<Skeleton width="95%" height={12} />
						<Skeleton width="80%" height={12} />
					</div>
				</div>
			))}
		</div>
	);
};
