import {FC, useEffect, useMemo, useRef} from 'react';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {ICategory, IComplexity, IGoalFolderTag} from '@/typings/goal';
import './title-with-tags.scss';

import {Tags} from '../Tags/Tags';
import {Title} from '../Title/Title';

interface TitleWithTagsProps {
	className?: string;
	title: string;
	theme?: 'light' | 'integrate';
	category: ICategory;
	complexity: IComplexity;
	totalCompleted: number;
	isList?: boolean;
	short?: boolean;
	categoryRank?: number;
	userFolders?: IGoalFolderTag[];
	estimatedTime?: string;
}

export const TitleWithTags: FC<TitleWithTagsProps> = (props) => {
	const {className, title, theme, category, complexity, totalCompleted, isList, short, categoryRank, userFolders, estimatedTime} = props;

	const [block, element] = useBem('title-with-tags', className);
	const containerRef = useRef<HTMLDivElement>(null);
	const baseStylesRef = useRef<{fontSize: number; lineHeight: number} | null>(null);
	const rafIdRef = useRef<number | null>(null);
	const lastValuesRef = useRef<{
		fontSize: string;
		lineHeight: string;
		transform: string;
		scrollHeight: number;
	} | null>(null);
	const {isScreenMobile} = useScreenSize();

	const MAX_HEIGHT = useMemo(() => (isScreenMobile ? 160 : 128), [isScreenMobile]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const hasHeaderWrapperClass = container.classList.contains('header-goal__wrapper');
		if (!hasHeaderWrapperClass) return;

		const titleElement = container.querySelector('h1, h2, h3, h4') as HTMLElement;
		if (!titleElement) return;

		if (!baseStylesRef.current) {
			const savedFontSize = titleElement.style.fontSize;
			const savedLineHeight = titleElement.style.lineHeight;
			titleElement.style.fontSize = '';
			titleElement.style.lineHeight = '';

			const computedStyle = window.getComputedStyle(titleElement);
			baseStylesRef.current = {
				fontSize: parseFloat(computedStyle.fontSize),
				lineHeight: parseFloat(computedStyle.lineHeight),
			};

			titleElement.style.fontSize = savedFontSize;
			titleElement.style.lineHeight = savedLineHeight;
		}

		const updateTransform = () => {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
			}

			rafIdRef.current = requestAnimationFrame(() => {
				const baseStyles = baseStylesRef.current!;
				const currentScrollHeight = container.scrollHeight;
				const currentFontSize = titleElement.style.fontSize;
				const currentLineHeight = titleElement.style.lineHeight;
				const currentTransform = container.style.transform;

				if (
					lastValuesRef.current &&
					lastValuesRef.current.scrollHeight === currentScrollHeight &&
					lastValuesRef.current.fontSize === currentFontSize &&
					lastValuesRef.current.lineHeight === currentLineHeight &&
					lastValuesRef.current.transform === currentTransform
				) {
					rafIdRef.current = null;
					return;
				}

				if (currentScrollHeight > MAX_HEIGHT) {
					const initialOverflow = currentScrollHeight - MAX_HEIGHT;
					const overflowRatio = Math.min(initialOverflow / MAX_HEIGHT, 1);

					// Уменьшаем шрифт пропорционально переполнению (максимально до 70%)
					const fontSizeReduction = Math.min(overflowRatio * 0.3, 0.3);
					const newFontSize = baseStyles.fontSize * (1 - fontSizeReduction);
					const newLineHeight = baseStyles.lineHeight * (1 - fontSizeReduction);

					titleElement.style.fontSize = `${newFontSize}px`;
					titleElement.style.lineHeight = `${newLineHeight}px`;

					rafIdRef.current = requestAnimationFrame(() => {
						const newScrollHeight = container.scrollHeight;

						if (newScrollHeight > MAX_HEIGHT) {
							const remainingOverflow = newScrollHeight - MAX_HEIGHT;
							const maxShift = isScreenMobile ? 24 : 30;
							const shift = Math.min(remainingOverflow, maxShift);
							container.style.transform = `translateY(-${shift}px)`;
						} else {
							container.style.transform = '';
						}

						lastValuesRef.current = {
							fontSize: titleElement.style.fontSize,
							lineHeight: titleElement.style.lineHeight,
							transform: container.style.transform,
							scrollHeight: newScrollHeight,
						};

						rafIdRef.current = null;
					});
				} else {
					if (currentFontSize || currentLineHeight || currentTransform) {
						container.style.transform = '';
						titleElement.style.fontSize = '';
						titleElement.style.lineHeight = '';

						lastValuesRef.current = {
							fontSize: '',
							lineHeight: '',
							transform: '',
							scrollHeight: currentScrollHeight,
						};
					}
					rafIdRef.current = null;
				}
			});
		};

		updateTransform();

		const resizeObserver = new ResizeObserver(() => {
			updateTransform();
		});

		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
			baseStylesRef.current = null;
			lastValuesRef.current = null;
		};
	}, [title, category, complexity, totalCompleted, categoryRank, userFolders, estimatedTime, short, MAX_HEIGHT, isScreenMobile]);

	return (
		<div ref={containerRef} className={block({theme})}>
			<Title className={element('title', {short})} tag="h1" theme={isList ? 'black' : 'white'}>
				{title}
			</Title>
			{!short && (
				<Tags
					category={category}
					medal={categoryRank ? `Топ ${categoryRank} в категории` : undefined}
					complexity={complexity}
					done={totalCompleted}
					theme={theme}
					userFolders={userFolders}
					estimatedTime={estimatedTime}
				/>
			)}
		</div>
	);
};
