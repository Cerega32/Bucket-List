import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';

import {Skeleton} from '../Skeleton/Skeleton';
import './catalog-items-skeleton.scss';

interface CatalogItemsSkeletonProps {
	className?: string;
	count?: number;
	isList?: boolean;
	withFilters?: boolean;
	columns?: '3' | '4';
}

export const CatalogItemsSkeleton: FC<CatalogItemsSkeletonProps> = (props) => {
	const {className, count = 12, isList, withFilters, columns} = props;
	const [block, element] = useBem('catalog-items-skeleton', className);
	const {isScreenSmallMobile} = useScreenSize();

	const horizontal = isList && !isScreenSmallMobile;

	return (
		<div className={block({list: !!isList, 'columns-3': columns === '3'})}>
			{withFilters && (
				<div className={element('filters')}>
					<div className={element('filters-left')}>
						<Skeleton width={240} height={40} borderRadius={8} />
					</div>
					<div className={element('filters-right')}>
						<Skeleton className={element('search')} height={40} borderRadius={8} />
						<Skeleton width={160} height={40} borderRadius={8} />
					</div>
				</div>
			)}

			<div className={element('grid')}>
				{Array.from({length: count}).map((_, i) => (
					<div key={i} className={element('card', {horizontal})}>
						<Skeleton className={element('image')} borderRadius={8} />
						<div className={element('body')}>
							<Skeleton height={20} />
							<Skeleton height={20} width="70%" />
							<div className={element('text')}>
								<Skeleton height={12} />
								<Skeleton height={12} />
								<Skeleton height={12} width="60%" />
							</div>
							<div className={element('footer')}>
								<Skeleton width={72} height={24} borderRadius={12} />
								<Skeleton width={72} height={24} borderRadius={12} />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
