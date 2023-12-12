import {FC, useEffect, useState} from 'react';
import {useBem} from '@/hooks/useBem';
import {CommentGoal} from '../CommentGoal/CommentGoal';
import {getComments} from '@/utils/api/get/getComments';
import {postLikeComment} from '@/utils/api/post/postLikeComment';
import {IComment} from '@/typings/comments';
import './comments-goal.scss';
import {GoalStore} from '@/store/GoalStore';
import {observer} from 'mobx-react';

interface CommentsGoalProps {
	className?: string;
	code: string;
}

export const CommentsGoal: FC<CommentsGoalProps> = observer((props) => {
	const {className, code} = props;

	const [block, element] = useBem('comments-goal', className);
	const {comments, setComments, setInfoPaginationComments} = GoalStore;

	useEffect(() => {
		(async () => {
			const res = await getComments(code);

			if (res.success) {
				setComments(res.data.data);
				setInfoPaginationComments(res.data.pagination);
			}
		})();
	}, []);

	const putScore = (i: number) => async (id: number, like: boolean) => {
		const res = await postLikeComment(id, like);

		if (res.success) {
			const startComments = comments.slice(0, i);
			const endComments = comments.slice(i + 1);

			setComments([
				...startComments,
				{...comments[i], ...res.data},
				...endComments,
			]);
		}
	};

	return (
		<div className={block()}>
			{/* TODO Добавить слайдер для фоток */}
			<section className={element('items')}>
				{comments &&
					!!comments.length &&
					comments.map((comment, i) => (
						<CommentGoal
							comment={comment}
							code={code}
							onClickScore={putScore(i)}
						/>
					))}
			</section>
		</div>
	);
});
