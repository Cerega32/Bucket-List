import {FC} from 'react';

import {Skeleton} from '@/components/Skeleton/Skeleton';
import {useBem} from '@/hooks/useBem';

import './list-goals-container-skeleton.scss';

interface ListGoalsContainerSkeletonProps {
	className?: string;
	goalsCount?: number;
}

export const ListGoalsContainerSkeleton: FC<ListGoalsContainerSkeletonProps> = (props) => {
	const {className, goalsCount = 6} = props;
	const [block, element] = useBem('list-goals-container-skeleton', className);

	return (
		<div className={block()}>
			<div className={element('header')}>
				<div className={element('header-wrapper')}>
					<Skeleton height={40} width="55%" />
					<div className={element('header-tags')}>
						<Skeleton width={96} height={28} borderRadius={14} />
						<Skeleton width={120} height={28} borderRadius={14} />
						<Skeleton width={80} height={28} borderRadius={14} />
					</div>
				</div>
			</div>

			<div className={element('wrapper')}>
				<aside className={element('aside')}>
					<Skeleton className={element('aside-image')} borderRadius={8} />
					<div className={element('aside-info')}>
						<Skeleton height={40} borderRadius={8} />
						<Skeleton height={40} borderRadius={8} />
						<Skeleton height={40} borderRadius={8} />
					</div>
				</aside>

				<div className={element('content')}>
					<div className={element('content-wrapper')}>
						<div className={element('description')}>
							<Skeleton height={14} />
							<Skeleton height={14} />
							<Skeleton height={14} />
							<Skeleton height={14} width="85%" />
						</div>

						<div className={element('progress')}>
							<Skeleton width={240} height={14} />
							<Skeleton height={10} borderRadius={5} />
							<Skeleton height={10} borderRadius={5} />
						</div>
					</div>

					<Skeleton width={220} height={20} />

					<div className={element('grid')}>
						{Array.from({length: goalsCount}).map((_, i) => (
							<div key={i} className={element('card')}>
								<Skeleton className={element('card-image')} borderRadius={8} />
								<div className={element('card-body')}>
									<div className={element('card-tags')}>
										<Skeleton width={70} height={20} borderRadius={10} />
										<Skeleton width={80} height={20} borderRadius={10} />
									</div>
									<Skeleton height={20} />
									<Skeleton height={20} width="70%" />
									<div className={element('card-text')}>
										<Skeleton height={12} />
										<Skeleton height={12} />
										<Skeleton height={12} width="60%" />
									</div>
									<div className={element('card-footer')}>
										<Skeleton width={72} height={24} borderRadius={12} />
										<Skeleton width={72} height={24} borderRadius={12} />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
