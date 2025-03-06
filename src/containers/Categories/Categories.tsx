import {FC, useEffect, useState} from 'react';

import {AllCategories} from '@/components/AllCategories/AllCategories';
import {ICategoryDetailed} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {getCategories} from '@/utils/api/get/getCategories';

export const Categories: FC<IPage> = () => {
	const [categories, setCategories] = useState<Array<ICategoryDetailed>>([]);

	useEffect(() => {
		(async () => {
			const res = await getCategories();
			if (res.success) {
				setCategories(res.data);
			}
		})();
	}, []);

	return <AllCategories categories={categories} />;
};
