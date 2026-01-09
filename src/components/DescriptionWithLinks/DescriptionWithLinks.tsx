import {FC, useEffect, useMemo, useRef, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {IGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import './description-with-links.scss';

import {Button} from '../Button/Button';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {Line} from '../Line/Line';
import {ITabs, Tabs} from '../Tabs/Tabs';

interface DescriptionWithLinksProps {
	className?: string;
}

interface DescriptionWithLinksProps {
	className?: string;
}

interface DescriptionListProps extends DescriptionWithLinksProps {
	isList: true;
	goal: IList;
	page?: never;
}

interface DescriptionGoalProps extends DescriptionWithLinksProps {
	goal: IGoal;
	page: string;
	isList?: never;
}

export const DescriptionWithLinks: FC<DescriptionListProps | DescriptionGoalProps> = (props) => {
	const {className, goal, page, isList} = props;

	const [block, element] = useBem('description-with-links', className);

	const [isExpanded, setIsExpanded] = useState(false);
	const [showMoreButton, setShowMoreButton] = useState(false);
	const textRef = useRef<HTMLParagraphElement>(null);

	const handleShowMore = () => {
		setIsExpanded(true);
	};

	// Проверяем, нужна ли кнопка "Читать подробнее"
	useEffect(() => {
		if (textRef.current) {
			const elementText = textRef.current;

			// Проверяем, обрезается ли текст при ограничении в 3 строки
			// Если scrollHeight больше clientHeight, значит текст обрезается
			const isTextTruncated = elementText.scrollHeight > elementText.clientHeight;

			setShowMoreButton(isTextTruncated);
		}
	}, [goal.description]);

	const tabs: Array<ITabs> = useMemo(
		() =>
			isList
				? []
				: [
						{
							url: '/',
							name: 'Отметки',
							page: 'isGoal',
							count: goal.totalComments,
						},
						{
							url: '/lists',
							name: 'Списки с целью',
							page: 'isGoalLists',
							count: goal.totalLists,
						},
				  ],
		[goal, isList]
	);

	return (
		<div className={block({list: isList})}>
			<div className={element('wrapper')}>
				<div className={element('text')}>
					<p ref={textRef} className={element('description', {expanded: isExpanded})}>
						{goal.description}
					</p>
					{!isExpanded && showMoreButton && (
						<Button theme="no-border" className={element('btn-more')} onClick={handleShowMore}>
							Читать подробнее
						</Button>
					)}
				</div>
				<InfoGoal
					className={element('info')}
					items={[
						{title: 'Добавили к себе', value: goal.totalAdded},
						{title: 'Выполнили', value: goal.totalCompleted},
					]}
					progressData={{
						completed: goal.totalCompleted,
						total: goal.totalAdded,
					}}
				/>
			</div>
			{!isList && (
				<>
					<Line margin="16px 0 0" />
					<Tabs base={`/goals/${goal.code}`} tabs={tabs} active={page} />
				</>
			)}
		</div>
	);
};
