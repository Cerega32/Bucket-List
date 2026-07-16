import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import {Skeleton} from '../Skeleton/Skeleton';
import './regular-goals-dropdown-skeleton.scss';

interface RegularGoalsDropdownSkeletonProps {
	className?: string;
	count?: number;
	variant?: 'regular' | 'progress';
}

export const RegularGoalsDropdownSkeleton: FC<RegularGoalsDropdownSkeletonProps> = (props) => {
	const {className, count = 1, variant = 'regular'} = props;
	const [block, element] = useBem('regular-goals-dropdown-skeleton', className);

	return (
		<div className={block()}>
			{Array.from({length: count}).map((_, i) => (
				<div key={i} className={element('item')}>
					<Skeleton className={element('image')} width={56} height={56} borderRadius={8} />
					<div className={element('content')}>
						<Skeleton width="85%" height={14} />
						{variant === 'progress' ? (
							<Skeleton height={6} borderRadius={3} />
						) : (
							<div className={element('days')}>
								{Array.from({length: 7}).map((__, d) => (
									<Skeleton key={d} width={16} height={16} borderRadius={6} />
								))}
							</div>
						)}
					</div>
					<Skeleton className={element('action')} width={32} height={32} borderRadius={8} />
				</div>
			))}
		</div>
	);
};
