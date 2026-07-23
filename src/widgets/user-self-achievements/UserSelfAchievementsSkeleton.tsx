import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Skeleton} from '@/shared/ui/Skeleton/Skeleton';

import '@/widgets/user-achievements/user-achievements-skeleton.scss';
import '@/widgets/user-self-achievements/user-self-achievements-skeleton.scss';

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
