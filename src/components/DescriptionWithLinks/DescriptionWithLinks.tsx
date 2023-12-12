import {FC, useMemo, useState} from 'react';
import {useBem} from '@/hooks/useBem';
import './description-with-links.scss';
import {CommentGoal} from '../CommentGoal/CommentGoal';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {IGoal} from '@/typings/goal';
import {ListGoals} from '../ListGoals/ListGoals';
import {Title} from '../Title/Title';
import {Button} from '../Button/Button';
import {ITabs, Tabs} from '../Tabs/Tabs';
import {Line} from '../Line/Line';
import {IList} from '@/typings/list';

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

export const DescriptionWithLinks: FC<
	DescriptionListProps | DescriptionGoalProps
> = (props) => {
	const {className, goal, page, isList} = props;

	const [block, element] = useBem('description-with-links', className);

	const [isShortDesc, setIsShortDesc] = useState(true);

	const handleToggleMore = () => {
		setIsShortDesc(!isShortDesc);
	};

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
						// {
						// 	url: '/similar',
						// 	name: 'Похожие цели',
						// 	page: 'isUserActiveGoals',
						// },
				  ],
		[goal]
	);

	return (
		<div className={block({list: isList})}>
			<div className={element('wrapper')}>
				<div className={element('text')}>
					<p className={element('short-text')}>
						{isShortDesc ? goal.shortDescription : goal.description}
					</p>
					{goal.shortDescription !== goal.description && (
						<Button
							icon="download"
							theme="blue-light"
							className={element('btn-more')}
							onClick={handleToggleMore}
						>
							{isShortDesc ? 'Читать подробнее' : 'Скрыть'}
						</Button>
					)}
				</div>
				<InfoGoal
					className={element('info')}
					totalAdded={goal.totalAdded}
					totalCompleted={goal.totalCompleted}
					progress
				/>
			</div>
			{!isList && (
				<>
					<Line margin="16px 0 0" />
					<Tabs
						base={`/goals/${goal.code}`}
						tabs={tabs}
						active={page}
					/>
				</>
			)}
		</div>
	);
};
