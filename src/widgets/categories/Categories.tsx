import {FC, useEffect, useState} from 'react';

import {getCategories} from '@/entities/category/api/getCategories';
import {sortMainCategories} from '@/entities/category/lib/categoriesOrder';
import {ICategoryDetailed} from '@/entities/goal/model/types';
import {AllCategories} from '@/widgets/all-categories/AllCategories';
import {CategoriesSkeleton} from '@/widgets/categories/CategoriesSkeleton';

interface CategoriesProps {
	tag?: 'h1' | 'h2' | 'h3';
	title?: string;
}

export const Categories: FC<CategoriesProps> = ({tag = 'h1', title = 'Категории'}) => {
	const [categories, setCategories] = useState<Array<ICategoryDetailed>>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		(async () => {
			setIsLoading(true);
			const res = await getCategories();
			if (res.success) {
				setCategories(sortMainCategories(res.data));
			}
			setIsLoading(false);
		})();
	}, []);

	if (isLoading) {
		return <CategoriesSkeleton />;
	}

	return <AllCategories categories={categories} tag={tag} title={title} variant="minimal" />;
};
