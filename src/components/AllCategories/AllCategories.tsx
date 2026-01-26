import {FC} from 'react';

import {CardCategory} from '@/components/CardCategory/CardCategory';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ICategoryDetailed} from '@/typings/goal';
import './all-categories.scss';

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
