import {FC} from 'react';

import {CardCategory} from '@/entities/category/ui/CardCategory/CardCategory';
import {ICategoryDetailed} from '@/entities/goal/model/types';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Title} from '@/shared/ui/Title/Title';
import '@/widgets/all-categories/all-categories.scss';

interface AllCategoriesProps {
	categories: Array<ICategoryDetailed>;
	tag: 'h1' | 'h2' | 'h3';
	title: string;
	variant?: 'default' | 'minimal';
}

export const AllCategories: FC<AllCategoriesProps> = ({categories, tag, title, variant = 'default'}) => {
	const [block, element] = useBem('categories');

	return (
		<main className={block()}>
			<Title className={element('title', {tag})} tag={tag}>
				{title}
			</Title>
			<section className={element('list', {variant})}>
				{!!categories.length &&
					categories.map((category) => (
						<CardCategory category={category} className={element('item')} key={category.id} variant={variant} />
					))}
			</section>
		</main>
	);
};
