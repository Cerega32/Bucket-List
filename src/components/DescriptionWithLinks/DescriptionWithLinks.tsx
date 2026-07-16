import {FC, useEffect, useMemo, useRef, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {IGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import './description-with-links.scss';

import {InfoGoal} from '../InfoGoal/InfoGoal';
import {Line} from '../Line/Line';
import {ITabs, Tabs} from '../Tabs/Tabs';

interface DescriptionWithLinksProps {
	className?: string;
}

interface DescriptionListProps extends DescriptionWithLinksProps {
	isList: true;
	goal: IList;
	page: string;
}

interface DescriptionGoalProps extends DescriptionWithLinksProps {
	goal: IGoal;
	page: string;
	isList?: never;
}

type DescriptionWithLinksPropsUnion = DescriptionListProps | DescriptionGoalProps;

const COLLAPSED_LINE_COUNT = 3;

const getLineHeight = (element: HTMLElement, styles: CSSStyleDeclaration): number => {
	const parsed = parseFloat(styles.lineHeight);
	if (Number.isFinite(parsed) && parsed > 0) {
		return parsed;
	}
	const fontSize = parseFloat(styles.fontSize);
	return Number.isFinite(fontSize) ? fontSize * 1.2 : 0;
};

/** С -webkit-line-clamp scrollHeight/clientHeight на элементе ненадёжны — сравниваем полную высоту с 3 строками. */
const measureDescriptionOverflow = (element: HTMLElement): boolean => {
	const width = element.clientWidth;
	if (width <= 0) {
		return false;
	}

	const styles = window.getComputedStyle(element);
	const lineHeight = getLineHeight(element, styles);
	if (lineHeight <= 0) {
		return false;
	}

	const maxCollapsedHeight = lineHeight * COLLAPSED_LINE_COUNT;
	const clone = element.cloneNode(true) as HTMLElement;
	clone.className = element.className.replace(/(?:^|\s)\S*--collapsed\b/g, '').trim();
	clone.style.cssText = `
		position: absolute;
		left: -9999px;
		top: 0;
		visibility: hidden;
		pointer-events: none;
		box-sizing: border-box;
		height: auto;
		max-height: none;
		overflow: visible;
		display: block;
		width: ${width}px;
		font: ${styles.font};
		letter-spacing: ${styles.letterSpacing};
		word-spacing: ${styles.wordSpacing};
		-webkit-line-clamp: unset;
		line-clamp: unset;
	`;
	document.body.appendChild(clone);
	const fullHeight = clone.getBoundingClientRect().height;
	clone.remove();

	return fullHeight > maxCollapsedHeight + 1;
};

export const DescriptionWithLinks: FC<DescriptionWithLinksPropsUnion> = (props) => {
	const {className, goal, page, isList} = props;

	const [block, element] = useBem('description-with-links', className);

	const [isShortDesc, setIsShortDesc] = useState(true);
	const [showToggleButton, setShowToggleButton] = useState(false);
	const textRef = useRef<HTMLParagraphElement>(null);

	useEffect(() => {
		setShowToggleButton(false);
		setIsShortDesc(true);
	}, [goal.description]);

	useEffect(() => {
		const textElement = textRef.current;
		if (!textElement || !isShortDesc) {
			return;
		}

		let cancelled = false;
		let rafId = 0;
		let timeoutId = 0;

		const checkOverflow = () => {
			if (cancelled || !textRef.current) {
				return;
			}
			setShowToggleButton(measureDescriptionOverflow(textRef.current));
		};

		const scheduleCheck = () => {
			cancelAnimationFrame(rafId);
			window.clearTimeout(timeoutId);
			rafId = requestAnimationFrame(checkOverflow);
			timeoutId = window.setTimeout(checkOverflow, 150);
		};

		scheduleCheck();

		const resizeObserver = new ResizeObserver(scheduleCheck);
		resizeObserver.observe(textElement);

		window.addEventListener('resize', scheduleCheck);
		document.fonts?.ready
			.then(() => {
				if (!cancelled) {
					scheduleCheck();
				}
			})
			.catch(() => {});

		return () => {
			cancelled = true;
			cancelAnimationFrame(rafId);
			window.clearTimeout(timeoutId);
			resizeObserver.disconnect();
			window.removeEventListener('resize', scheduleCheck);
		};
	}, [isShortDesc, goal.description]);

	const handleToggleMore = () => {
		setIsShortDesc(!isShortDesc);
	};

	const tabs: Array<ITabs> = useMemo(() => {
		if (isList) {
			return [
				{
					url: '/',
					name: 'Список целей',
					page: 'isList',
					count: goal.goalsCount,
				},
				{
					url: '/impressions',
					name: 'Впечатления',
					page: 'isListImpressions',
					count: goal.totalComments,
				},
			];
		}

		const baseTabs: Array<ITabs> = [
			{
				url: '/',
				name: 'Впечатления',
				page: 'isGoal',
				count: goal.totalComments,
			},
			{
				url: '/lists',
				name: 'Списки с целью',
				page: 'isGoalLists',
				count: goal.totalLists,
			},
		];

		// Вкладка "История прогресса выполнения" — только если есть записи прогресса (не регулярные цели),
		if (goal.addedByUser && !goal.regularConfig && (goal.progressEntriesCount ?? 0) > 0) {
			baseTabs.push({
				url: '/progress-history',
				name: 'История прогресса выполнения',
				page: 'isGoalProgressHistory',
				count: goal.progressEntriesCount ?? 0,
			});
		}

		// Добавляем вкладку "История выполнения" только если цель регулярная,
		// добавлена пользователем и у неё есть статистика (цель начата)
		// История может быть пустой, но вкладка должна быть доступна для просмотра
		if (goal.regularConfig && goal.addedByUser && goal.regularConfig.statistics && goal.regularConfig.id) {
			baseTabs.push({
				url: '/history',
				name: 'История выполнения',
				page: 'isGoalHistory',
			});
		}

		// Добавляем вкладку "Рейтинг" только если цель регулярная, бессрочная, без пользовательских настроек и добавлена пользователем
		if (
			goal.regularConfig &&
			goal.addedByUser &&
			goal.regularConfig.id &&
			goal.regularConfig.durationType === 'indefinite' &&
			!goal.regularConfig.allowCustomSettings
		) {
			baseTabs.push({
				url: '/rating',
				name: 'Рейтинг',
				page: 'isGoalRating',
			});
		}

		return baseTabs;
	}, [goal, isList]);

	return (
		<div className={block({list: isList})}>
			<div className={element('wrapper')}>
				<div className={element('text')}>
					<p ref={textRef} className={element('short-text', {collapsed: isShortDesc})}>
						{goal.description}
					</p>
					{showToggleButton && (
						<button type="button" className={element('toggle-button')} onClick={handleToggleMore}>
							{isShortDesc ? 'Показать полностью' : 'Скрыть'}
						</button>
					)}
				</div>
				<InfoGoal
					className={element('info')}
					items={[
						{title: 'Добавили к себе', value: goal.totalAdded},
						{title: 'Выполнили', value: goal.totalCompleted},
					]}
				/>
			</div>
			<Line margin="16px 0 0" />
			<Tabs base={isList ? `/list/${goal.code}` : `/goals/${goal.code}`} tabs={tabs} active={page} preventScrollReset />
		</div>
	);
};
