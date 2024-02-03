import {FC, useEffect, useState} from 'react';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {getCategories} from '@/utils/api/get/getCategories';
import {IPage} from '@/typings/page';
import {ICategoryDetailed} from '@/typings/goal';
import {CardCategory} from '@/components/CardCategory/CardCategory';
import {Title} from '@/components/Title/Title';
import './categories.scss';

export const Categories: FC<IPage> = () => {
	const [block, element] = useBem('categories');

	const [categories, setCategories] = useState<Array<ICategoryDetailed>>([]);

	const {setHeader} = ThemeStore;

	useEffect(() => {
		(async () => {
			const res = await getCategories();
			if (res.success) {
				setCategories(res.data);
			}
		})();
	}, []);

	useEffect(() => {
		setHeader('white');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<main className={block()}>
			<Title className={element('title')} tag="h1">
				Категории
			</Title>
			<section className={element('list')}>
				{!!categories.length &&
					categories.map((category) => (
						<CardCategory
							category={category}
							className={element('item')}
						/>
					))}
			</section>
		</main>
	);
};
