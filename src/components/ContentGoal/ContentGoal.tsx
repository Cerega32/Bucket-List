import {observer} from 'mobx-react';
import {FC, useEffect, useState} from 'react';

import './content-goal.scss';
import {CommentsGoal} from '../CommentsGoal/CommentsGoal';
import {DescriptionWithLinks} from '../DescriptionWithLinks/DescriptionWithLinks';

import {ListsWithGoal} from '../ListsWithGoal/ListsWithGoal';

import {useBem} from '@/hooks/useBem';
import {GoalStore} from '@/store/GoalStore';
import {IGoal} from '@/typings/goal';
import {getComments} from '@/utils/api/get/getComments';

interface ContentGoalProps {
	className?: string;
	goal: IGoal;
	page: string;
}

export const ContentGoal: FC<ContentGoalProps> = observer((props) => {
	const {className, goal, page} = props;

	const [block, element] = useBem('content-goal', className);

	const {comments, setComments, setInfoPaginationComments} = GoalStore;

	useEffect(() => {
		if (page === 'isGoal') {
			(async () => {
				const res = await getComments(goal.code);

				if (res.success) {
					setComments(res.data.data);
					setInfoPaginationComments(res.data.pagination);
				}
			})();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [goal.code, page]);

	const getGoalContent = () => {
		switch (page) {
			case 'isGoal':
				return <CommentsGoal comments={comments} />;
			case 'isGoalLists':
				return <ListsWithGoal code={goal.code} />;
			default:
				return null;
		}
	};

	return (
		<article className={block()}>
			{/* <div className={element('')}> */}
			<DescriptionWithLinks goal={goal} page={page} />
			{/* </div> */}

			{/* {!!goal.listsCount && (
				<ListGoals
					list={goal.lists}
					title="Списки с целью"
					// count={goal.listsCount}
					className={element('section')}
					columns="two"
				/>
			)} */}
			<section className={element('comments')}>
				{/* <Title tag="h2" className={element('title-section')}>
					Отметки выполнения&nbsp;
					<span className={element('title-counter')}>256</span>
				</Title> */}
				{getGoalContent()}
			</section>
		</article>
	);
});
