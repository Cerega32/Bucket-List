import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';
import './user-info-skeleton.scss';

interface UserInfoSkeletonProps {
	className?: string;
	withTabs?: boolean;
}

export const UserInfoSkeleton: FC<UserInfoSkeletonProps> = (props) => {
	const {className, withTabs = true} = props;
	const [block, element] = useBem('user-info-skeleton', className);

	return (
		<div className={block()}>
			<Skeleton className={element('bg')} borderRadius={0} />
			<div className={element('about')}>
				<Skeleton className={element('avatar')} circle width={196} height={196} />
				<div className={element('wrapper')}>
					<div className={element('name-block')}>
						<Skeleton height={28} className={element('title')} />
						<Skeleton width={160} height={14} />
						<Skeleton width="80%" height={14} />
					</div>
					<div className={element('stats')}>
						{Array.from({length: 3}).map((_, i) => (
							<div key={i} className={element('stats-item')}>
								<Skeleton width={60} height={20} />
								<Skeleton width={80} height={12} />
							</div>
						))}
					</div>
				</div>
			</div>
			{withTabs && (
				<div className={element('tabs')}>
					{Array.from({length: 5}).map((_, i) => (
						<Skeleton key={i} width={120} height={32} borderRadius={8} />
					))}
				</div>
			)}
		</div>
	);
};
