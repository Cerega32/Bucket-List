import {FC, useMemo, useState} from 'react';

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

	const [isShortDesc, setIsShortDesc] = useState(true);

	const handleToggleMore = () => {
		setIsShortDesc(!isShortDesc);
	};

	const tabs: Array<ITabs> = useMemo(() => {
		if (isList) {
			return [];
		}

		const baseTabs: Array<ITabs> = [
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
		];

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

		// Добавляем вкладку "Рейтинг" только если цель регулярная, бессрочная и добавлена пользователем
		if (goal.regularConfig && goal.addedByUser && goal.regularConfig.id && goal.regularConfig.durationType === 'indefinite') {
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
					<p className={element('short-text')}>{isShortDesc ? goal.shortDescription : goal.description}</p>
					{goal.shortDescription !== goal.description && (
						<Button icon="download" theme="blue-light" className={element('btn-more')} onClick={handleToggleMore}>
							{isShortDesc ? 'Читать подробнее' : 'Скрыть'}
						</Button>
					)}
				</div>
				<InfoGoal
					className={element('info')}
					items={[
						{title: 'Добавили к себе', value: goal.totalAdded},
						{title: 'Выполнили', value: goal.totalCompleted},
					]}
					progress
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
