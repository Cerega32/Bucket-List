import {observer} from 'mobx-react';
import {FC} from 'react';

import {CommentGoal} from '../CommentGoal/CommentGoal';

import {useBem} from '@/hooks/useBem';
import {IComment} from '@/typings/comments';
import {postLikeComment} from '@/utils/api/post/postLikeComment';
import './comments-goal.scss';

interface CommentsGoalProps {
	className?: string;
	comments: Array<IComment>;
	isUser?: boolean;
	setComments(comments: Array<IComment>): void;
}

export const CommentsGoal: FC<CommentsGoalProps> = observer((props) => {
	const {className, comments, isUser, setComments} = props;

	const [block, element] = useBem('comments-goal', className);

	const putScore = (i: number) => async (id: number, like: boolean) => {
		const res = await postLikeComment(id, like);

		if (res.success) {
			const startComments = comments.slice(0, i);
			const endComments = comments.slice(i + 1);

			setComments([...startComments, {...comments[i], ...res.data}, ...endComments]);
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
							className={element('comment')}
							key={comment.id}
							isUser={isUser}
							comment={comment}
							onClickScore={putScore(i)}
						/>
					))}
			</section>
		</div>
	);
});
