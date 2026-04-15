import {FC, RefObject, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';

import './header-category.scss';

import {useBem} from '@/hooks/useBem';
import {ICategoryWithSubcategories} from '@/typings/goal';

import {Title} from '../Title/Title';

interface HeaderCategoryProps {
	className?: string;
	category: ICategoryWithSubcategories;
	isSub?: boolean;
	refHeader: RefObject<HTMLElement>;
	onCompactChange?: (compact: boolean) => void;
	onHeightChange?: (height: number) => void;
}

export const HeaderCategory: FC<HeaderCategoryProps> = (props) => {
	const {className, category, isSub, refHeader, onCompactChange, onHeightChange} = props;

	const [block, element] = useBem('header-category', className);
	const [compact, setCompact] = useState(false);
	const compactRef = useRef(false);
	const expandedHeightRef = useRef<number | null>(null);

	useEffect(() => {
		compactRef.current = compact;
		if (compact && refHeader.current) {
			refHeader.current.style.clipPath = '';
		}
		onCompactChange?.(compact);
	}, [compact]);

	const updateHeaderHeight = () => {
		if (!refHeader.current) return;
		const saved = refHeader.current.style.clipPath;
		refHeader.current.style.clipPath = '';
		const h = refHeader.current.offsetHeight;
		refHeader.current.style.clipPath = saved;
		if (!compactRef.current) {
			const prev = expandedHeightRef.current;
			if (prev == null || h !== prev) {
				expandedHeightRef.current = h;
				onHeightChange?.(h);
			}
		}
	};

	useEffect(() => {
		updateHeaderHeight();
		window.addEventListener('resize', updateHeaderHeight);
		return () => {
			window.removeEventListener('resize', updateHeaderHeight);
		};
	}, [category]);

	useEffect(() => {
		let rafId: number | null = null;
		let ticking = false;

		const onScroll = () => {
			if (ticking) return;
			ticking = true;

			rafId = window.requestAnimationFrame(() => {
				ticking = false;

				const scrollY = window.scrollY || 0;
				const currentCompact = compactRef.current;
				const expandedH = expandedHeightRef.current ?? 0;
				const minHeight = 136;

				if (expandedH <= 0) return;

				const newHeight = Math.max(minHeight, expandedH - scrollY);

				if (newHeight <= minHeight && !currentCompact) {
					setCompact(true);
				} else if (newHeight > minHeight && currentCompact) {
					setCompact(false);
				}

				if (!currentCompact && !(newHeight <= minHeight)) {
					const clipBottom = expandedH - newHeight;
					if (refHeader.current) {
						refHeader.current.style.clipPath = clipBottom > 0 ? `inset(0 0 ${clipBottom}px 0)` : '';
					}
				}
			});
		};

		onScroll();

		window.addEventListener('scroll', onScroll, {passive: true});
		return () => {
			window.removeEventListener('scroll', onScroll);
			if (rafId != null) window.cancelAnimationFrame(rafId);
		};
	}, []);

	return (
		<header
			className={block({
				category: isSub && category.category.parentCategory?.nameEn ? category.category.nameEn : category.category.nameEn,
				fixed: compact,
			})}
			style={{backgroundImage: `url(${category.category.image})`}}
			ref={refHeader}
		>
			<div className={element('title-wrapper')}>
				{isSub && category.category.parentCategory && (
					<Link className={element('title-link')} to={`/categories/${category.category.parentCategory.nameEn}`}>
						<Title className={element('title-link-text')} tag="h1">
							{category.category.parentCategory.name}
						</Title>
					</Link>
				)}
				<span className={element('title-group')}>
					{category.category.parentCategory?.name && (
						<Title tag="h1" theme="white" className={element('title-separator')}>
							/
						</Title>
					)}
					<Title tag="h1" theme="white" className={element('title')}>
						{category.category.name}
					</Title>
				</span>
			</div>
			{!!category.subcategories.length && !compact && (
				<section className={element('subcategories')}>
					{category.subcategories.map((subcategory) => (
						<Link
							className={element('subcategory')}
							to={`/categories/${category.category.nameEn}/${subcategory.nameEn}`}
							key={subcategory.nameEn}
						>
							{/* Дизайнер решил пока не использовать иконки подкатегорий */}
							{/* {subcategory.icon && (
								<img className={element('subcategory-icon')} src={subcategory.icon} alt={subcategory.name} />
							)} */}
							{subcategory.name}
						</Link>
					))}
				</section>
			)}
		</header>
	);
};
