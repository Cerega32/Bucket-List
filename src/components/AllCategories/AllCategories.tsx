import {FC} from 'react';

import {CardCategory} from '@/components/CardCategory/CardCategory';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ICategoryDetailed} from '@/typings/goal';
import './all-categories.scss';

interface AllCategoriesProps {
	categories: Array<ICategoryDetailed>;
}

export const AllCategories: FC<AllCategoriesProps> = ({categories}) => {
	const [block, element] = useBem('categories');

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
