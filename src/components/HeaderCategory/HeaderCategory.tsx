import {FC, MutableRefObject, RefObject, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import './header-category.scss';
import {Title} from '../Title/Title';

import {useBem} from '@/hooks/useBem';
import {ICategoryWithSubcategories} from '@/typings/goal';

interface HeaderCategoryProps {
	className?: string;
	category: ICategoryWithSubcategories;
	isSub?: boolean;
	ref: RefObject<HTMLElement>;
}

export const HeaderCategory: FC<HeaderCategoryProps> = (props) => {
	const {className, category, isSub, ref} = props;

	const [block, element] = useBem('header-category', className);
	const [isFixed, setIsFixed] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY;
			const shouldFix = scrollPosition > 160;
			setIsFixed(shouldFix);
		};

		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<header
			className={block({
				category:
					isSub && category.category.parentCategory?.nameEn ? category.category.parentCategory?.nameEn : category.category.nameEn,
				fixed: isFixed,
			})}
			style={{backgroundImage: `url(${category.category.image})`}}
			ref={ref}
		>
			<div className={element('title-wrapper')}>
				{isSub && category.category.parentCategory && (
					<Link to={`/categories/${category.category.parentCategory.nameEn}`}>
						<Title className={element('title-link')} tag="h1">
							{category.category.parentCategory.name}&nbsp;/&nbsp;
						</Title>
					</Link>
				)}
				<Title tag="h1" theme="white" className={element('title')}>
					{category.category.name}
				</Title>
			</div>
			{!!category.subcategories.length && !isFixed && (
				<section className={element('subcategories')}>
					{category.subcategories.map((subcategory) => (
						<Link className={element('subcategory')} to={`/categories/${category.category.nameEn}/${subcategory.nameEn}`}>
							{subcategory.icon && <img src={subcategory.icon} alt={subcategory.name} />}
							{subcategory.name}
						</Link>
					))}
				</section>
			)}
		</header>
	);
};
