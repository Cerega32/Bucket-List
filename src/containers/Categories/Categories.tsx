import {FC, useEffect, useState} from 'react';

import {AllCategories} from '@/components/AllCategories/AllCategories';
import {Loader} from '@/components/Loader/Loader';
import {ICategoryDetailed} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {getCategories} from '@/utils/api/get/getCategories';

export const Categories: FC<IPage> = () => {
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
			<AllCategories categories={categories} />
		</Loader>
	);
};
