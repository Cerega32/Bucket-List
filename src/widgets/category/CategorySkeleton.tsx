import {FC} from 'react';

import {CatalogItemsSkeleton} from '@/features/catalog-items/CatalogItemsSkeleton';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {Skeleton} from '@/shared/ui/Skeleton/Skeleton';
import {Title} from '@/shared/ui/Title/Title';

import '@/widgets/category/category-skeleton.scss';

interface CategorySkeletonProps {
	className?: string;
	popularGoalsCount?: number;
	popularListsCount?: number;
	withHeader?: boolean;
	withSubcategories?: boolean;
	subcategoriesCount?: number;
}

export const CategorySkeleton: FC<CategorySkeletonProps> = (props) => {
	const {className, popularGoalsCount = 4, popularListsCount = 4, withHeader, withSubcategories, subcategoriesCount = 4} = props;
	const [block, element] = useBem('category-skeleton', className);
	const {isScreenSmallMobile} = useScreenSize();

	const listCount = isScreenSmallMobile ? popularListsCount * 2 : popularListsCount;

	return (
		<div className={block({'with-header': !!withHeader})}>
			{withHeader && (
				<div className={element('header')}>
					<Skeleton className={element('header-title')} width="60%" height={44} />
					{withSubcategories && (
						<div className={element('header-subs')}>
							{Array.from({length: subcategoriesCount}).map((_, i) => (
								<Skeleton key={i} className={element('header-sub')} borderRadius={8} />
							))}
						</div>
					)}
				</div>
			)}

			<section className={element('section')}>
				<Title tag="h2" className={element('section-title')}>
					Популярные цели этой недели
				</Title>
				<CatalogItemsSkeleton count={popularGoalsCount} />
			</section>

			<section className={element('section')}>
				<Title tag="h2" className={element('section-title')}>
					Популярные списки этой недели
				</Title>
				<CatalogItemsSkeleton count={listCount} isList />
			</section>
		</div>
	);
};
