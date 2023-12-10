import {FC, useEffect, useState} from 'react';
import {useBem} from '@/hooks/useBem';
import './content-goal.scss';
import {CommentGoal} from '../CommentGoal/CommentGoal';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {IGoal} from '@/typings/goal';
import {ListGoals} from '../ListGoals/ListGoals';
import {Title} from '../Title/Title';
import {Button} from '../Button/Button';
import {DescriptionWithLinks} from '../DescriptionWithLinks/DescriptionWithLinks';
import {getComments} from '@/utils/api/get/getComments';
import {postLikeComment} from '@/utils/api/post/postLikeComment';
import {IComment} from '@/typings/comments';
import {CommentsGoal} from '../CommentsGoal/CommentsGoal';
import {ListsWithGoal} from '../ListsWithGoal/ListsWithGoal';
import {observer} from 'mobx-react';
import {GoalStore} from '@/store/GoalStore';

interface ContentGoalProps {
	className?: string;
	goal: IGoal;
	page: string;
}

export const ContentGoal: FC<ContentGoalProps> = observer((props) => {
	const {className, goal, page} = props;

	const [block, element] = useBem('content-goal', className);

	const getGoalContent = () => {
		switch (page) {
			case 'isGoal':
				return <CommentsGoal code={goal.code} />;
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
