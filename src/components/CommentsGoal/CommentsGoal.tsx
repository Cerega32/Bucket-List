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
	hasMyComment?: boolean;
	hasMore?: boolean;
	isLoadingMore?: boolean;
	onLoadMore?(): void;
	setComments(comments: Array<IComment>): void;
}

export const CommentsGoal: FC<CommentsGoalProps> = observer((props) => {
	const {className, comments, isUser, setComments, hasMyComment, canAddReview, hasMore, isLoadingMore, onLoadMore} = props;

	const [block, element] = useBem('comments-goal', className);
	const {setIsOpen, setWindow} = ModalStore;

	const openAddReview = () => {
		setWindow('add-review');
		setIsOpen(true);
	};

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
			<section className={element('items')}>
				{comments && !!comments.length ? (
					<>
						{comments.map((comment, i) => (
							<CommentGoal
								className={element('comment')}
								key={comment.id}
								isUser={isUser}
								comment={comment}
								onClickScore={putScore(i)}
							/>
						))}
						{hasMore && (
							<div className={element('load-more')}>
								<Button theme="blue-light" width="auto" icon="download" onClick={onLoadMore} disabled={isLoadingMore}>
									{isLoadingMore ? 'Загрузка...' : 'Загрузить ещё'}
								</Button>
							</div>
						)}
					</>
				) : !hasMyComment ? (
					<EmptyState title="Пока нет впечатлений" description="Но вы можете стать примером для других">
						{canAddReview && (
							<Button theme="blue" size="small" icon="comment" onClick={openAddReview}>
								Добавить впечатление
							</Button>
						)}
					</EmptyState>
				) : null}
			</section>
		</div>
	);
});
