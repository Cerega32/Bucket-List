import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {IComment} from '@/typings/comments';
import {postLikeComment} from '@/utils/api/post/postLikeComment';

import {Button} from '../Button/Button';
import {CommentGoal} from '../CommentGoal/CommentGoal';
import {EmptyState} from '../EmptyState/EmptyState';
import './comments-goal.scss';

interface CommentsGoalProps {
	className?: string;
	comments: Array<IComment>;
	isUser?: boolean;
	canAddReview?: boolean;
	setComments(comments: Array<IComment>): void;
}

export const CommentsGoal: FC<CommentsGoalProps> = observer((props) => {
	const {className, comments, isUser, canAddReview, setComments} = props;

	const [block, element] = useBem('comments-goal', className);
	const {setIsOpen, setWindow} = ModalStore;

	const openAddReview = () => {
		setWindow('add-review');
		setIsOpen(true);
	};

	const putScore = (i: number) => async (id: number, like: boolean) => {
		const res = await postLikeComment(id, like);

		if (res.success) {
			// Обновляем прогресс заданий при лайке
			// Прогресс заданий обновляется автоматически на бэкенде

			const startComments = comments.slice(0, i);
			const endComments = comments.slice(i + 1);
			setComments([...startComments, {...comments[i], ...res.data}, ...endComments]);
		}
	};

	return (
		<div className={block()}>
			<section className={element('items')}>
				{comments && !!comments.length ? (
					comments.map((comment, i) => (
						<CommentGoal
							className={element('comment')}
							key={comment.id}
							isUser={isUser}
							comment={comment}
							onClickScore={putScore(i)}
						/>
					))
				) : (
					<EmptyState title="Пока нет впечатлений" description="Но вы можете стать примером для других">
						{canAddReview && (
							<Button theme="blue" size="small" icon="comment" onClick={openAddReview}>
								Добавить впечатление
							</Button>
						)}
					</EmptyState>
				)}
			</section>
		</div>
	);
});
