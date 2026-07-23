import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {postLikeComment} from '@/entities/comment/api/postLikeComment';
import {IComment} from '@/entities/comment/model/types';
import {CommentGoal} from '@/entities/comment/ui/CommentGoal/CommentGoal';
import {CommentImagesGallery} from '@/entities/comment/ui/CommentImagesGallery/CommentImagesGallery';
import {useBem} from '@/shared/lib/hooks/useBem';
import {ModalStore} from '@/shared/model/ModalStore';
import {Button} from '@/shared/ui/Button/Button';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';
import Select, {OptionSelect} from '@/shared/ui/Select/Select';
import '@/entities/comment/ui/CommentsGoal/comments-goal.scss';

interface CommentsGoalProps {
	className?: string;
	comments: Array<IComment>;
	isUser?: boolean;
	canAddReview?: boolean;
	hasMyComment?: boolean;
	hasMore?: boolean;
	isLoadingMore?: boolean;
	isShowcase?: boolean;
	showcasePhotos?: string[];
	sortOptions?: Array<OptionSelect>;
	activeSort?: number;
	isSorting?: boolean;
	onSortChange?(active: number): void;
	onLoadMore?(): void;
	onAddReview?(): void;
	setComments(comments: Array<IComment>): void;
}

export const CommentsGoal: FC<CommentsGoalProps> = observer((props) => {
	const {
		className,
		comments,
		isUser,
		setComments,
		hasMyComment,
		canAddReview,
		hasMore,
		isLoadingMore,
		onLoadMore,
		onAddReview,
		isShowcase,
		showcasePhotos,
		sortOptions,
		activeSort,
		isSorting,
		onSortChange,
	} = props;

	const [block, element] = useBem('comments-goal', className);
	const {setIsOpen, setWindow} = ModalStore;

	const openAddReview = () => {
		if (onAddReview) {
			onAddReview();
			return;
		}
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

	const showSort = Boolean(isShowcase && comments.length > 0 && sortOptions?.length && onSortChange && typeof activeSort === 'number');

	return (
		<div className={block()}>
			{isShowcase && showcasePhotos && showcasePhotos.length > 0 && (
				<CommentImagesGallery images={showcasePhotos} navSuffix="showcase" imageShowcase />
			)}
			{showSort && (
				<div className={element('toolbar')}>
					<Select
						className={element('sort')}
						options={sortOptions!}
						activeOption={activeSort!}
						onSelect={onSortChange!}
						filter
						disabled={isSorting}
					/>
				</div>
			)}
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
