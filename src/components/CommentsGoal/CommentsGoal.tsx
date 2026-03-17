import {observer} from 'mobx-react-lite';
import {FC, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {IComment} from '@/typings/comments';
import {postLikeComment} from '@/utils/api/post/postLikeComment';

import {Button} from '../Button/Button';
import {CommentGoal} from '../CommentGoal/CommentGoal';
import {EmptyState} from '../EmptyState/EmptyState';
import './comments-goal.scss';

const INITIAL_VISIBLE = 3;
const LOAD_MORE_STEP = 10;

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
	const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

	const openAddReview = () => {
		setWindow('add-review');
		setIsOpen(true);
	};

	const displayedComments = comments.slice(0, visibleCount);
	const hasMore = comments.length > visibleCount;
	const showLoadMoreButton = comments.length > INITIAL_VISIBLE;

	const handleLoadMore = () => {
		setVisibleCount((prev) => prev + LOAD_MORE_STEP);
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
						{displayedComments.map((comment, i) => (
							<CommentGoal
								className={element('comment')}
								key={comment.id}
								isUser={isUser}
								comment={comment}
								onClickScore={putScore(i)}
							/>
						))}
						{showLoadMoreButton && hasMore && (
							<div className={element('load-more')}>
								<Button theme="blue-light" width="auto" icon="download" onClick={handleLoadMore}>
									Загрузить ещё
								</Button>
							</div>
						)}
					</>
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
