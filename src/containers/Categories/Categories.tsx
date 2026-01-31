import {FC, useEffect, useState} from 'react';

import {AllCategories} from '@/components/AllCategories/AllCategories';
import {Loader} from '@/components/Loader/Loader';
import {ICategoryDetailed} from '@/typings/goal';
import {getCategories} from '@/utils/api/get/getCategories';

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
				setCategories(res.data);
			}
			setIsLoading(false);
		})();
	}, []);

	return (
		<Loader isLoading={isLoading}>
			<AllCategories categories={categories} tag={tag} title={title} variant="minimal" />
		</Loader>
	);
};
