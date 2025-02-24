import {FC, useEffect, useState} from 'react';

import {CardCategory} from '@/components/CardCategory/CardCategory';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ICategoryDetailed} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {getCategories} from '@/utils/api/get/getCategories';
import './categories.scss';

export const Categories: FC<IPage> = () => {
	const [block, element] = useBem('categories');

	const [categories, setCategories] = useState<Array<ICategoryDetailed>>([]);

	useEffect(() => {
		(async () => {
			const res = await getCategories();
			if (res.success) {
				setCategories(res.data);
			}
		})();
	}, []);

	return (
		<main className={block()}>
			<Title className={element('title')} tag="h1">
				Категории
			</Title>
			<section className={element('list')}>
				{!!categories.length &&
					categories.map((category) => <CardCategory category={category} className={element('item')} key={category.id} />)}
			</section>
		</main>
	);
};
