import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import '@/containers/UserAchievements/user-achievements-skeleton.scss';
import './user-self-achievements-skeleton.scss';

interface UserSelfAchievementsSkeletonProps {
	groupsCount?: number;
	cardsPerGroup?: number;
}

export const UserSelfAchievementsSkeleton: FC<UserSelfAchievementsSkeletonProps> = (props) => {
	const {groupsCount = 3, cardsPerGroup = 6} = props;
	const [block, element] = useBem('user-self-achievements-skeleton');
	const [, cardElement] = useBem('user-achievements-skeleton');

	return (
		<div className={block()}>
			{Array.from({length: groupsCount}).map((_, g) => (
				<div key={g} className={element('group')}>
					<Skeleton className={element('group-title')} width={220} height={28} />
					<div className={element('grid')}>
						{Array.from({length: cardsPerGroup}).map((__, i) => (
							<div key={i} className={cardElement('card')}>
								<Skeleton className={cardElement('card-img')} width={40} height={40} />
								<div className={cardElement('card-text')}>
									<Skeleton width="80%" height={18} />
									<Skeleton width="90%" height={12} />
									<Skeleton width="70%" height={12} />
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
};
