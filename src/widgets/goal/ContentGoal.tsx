import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {deleteReview} from '@/entities/comment/api/deleteReview';
import {getGoalImpressionImages, getInitialComments, getMoreComments} from '@/entities/comment/api/getComments';
import {postLikeComment} from '@/entities/comment/api/postLikeComment';
import {IComment} from '@/entities/comment/model/types';
import {CommentImagesGallery} from '@/entities/comment/ui/CommentImagesGallery/CommentImagesGallery';
import {CommentsGoal} from '@/entities/comment/ui/CommentsGoal/CommentsGoal';
import {CommentsGoalSkeleton} from '@/entities/comment/ui/CommentsGoal/CommentsGoalSkeleton';
import {MyReview} from '@/entities/comment/ui/MyReview/MyReview';
import {GoalStore} from '@/entities/goal/model/GoalStore';
import {IGoal} from '@/entities/goal/model/types';
import {ComplexityDisplay} from '@/entities/goal/ui/ComplexityDisplay/ComplexityDisplay';
import {DescriptionWithLinks} from '@/entities/goal/ui/DescriptionWithLinks/DescriptionWithLinks';
import {InfoGoal} from '@/entities/goal/ui/InfoGoal/InfoGoal';
import {ListsWithGoal} from '@/entities/goal-list/ui/ListsWithGoal/ListsWithGoal';
import {RegularGoalHistory} from '@/entities/regular-goal/ui/RegularGoalHistory/RegularGoalHistory';
import {RegularGoalRating} from '@/entities/regular-goal/ui/RegularGoalRating/RegularGoalRating';
import {CatalogModerationBanner} from '@/features/catalog-moderation-banner/CatalogModerationBanner';
import {useBem} from '@/shared/lib/hooks/useBem';
import {ModalStore} from '@/shared/model/ModalStore';
import {Banner} from '@/shared/ui/Banner/Banner';
import {GoalProgressHistory} from '@/widgets/goal/GoalProgressHistory';
import '@/widgets/goal/content-goal.scss';

interface ContentGoalProps {
	className?: string;
	goal: IGoal;
	page: string;
	historyRefreshTrigger?: number;
	onListChanged?: () => void;
	onEditClick?: () => void;
}

export const ContentGoal: FC<ContentGoalProps> = observer((props) => {
	const {className, goal, page, historyRefreshTrigger, onListChanged, onEditClick} = props;

	const [block, element] = useBem('content-goal', className);
	const navigate = useNavigate();

	const {
		comments,
		myComment,
		setComments,
		appendComments,
		setMyComment,
		commentPhotos,
		setCommentPhotos,
		hasMoreComments,
		setHasMoreComments,
		commentsNextPage,
		setCommentsNextPage,
	} = GoalStore;
	const {setIsOpen, setWindow, setModalProps, setFuncModal} = ModalStore;

	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [loadedForCode, setLoadedForCode] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoadedForCode(null);
		setComments([]);
		setMyComment(null);
		setCommentPhotos([]);
		setHasMoreComments(false);
		setCommentsNextPage(null);

		(async () => {
			const [commentsRes, imagesRes] = await Promise.all([getInitialComments(goal.code), getGoalImpressionImages(goal.code)]);
			if (cancelled) return;

			if (commentsRes.success && commentsRes.data) {
				setMyComment(commentsRes.data.myComment ?? (commentsRes.data as any).my_comment ?? null);
				setComments(commentsRes.data.comments);
				setHasMoreComments(commentsRes.data.hasMore ?? (commentsRes.data as any).has_more ?? false);
				setCommentsNextPage(commentsRes.data.nextPage ?? (commentsRes.data as any).next_page ?? null);
			}

			if (imagesRes.success && imagesRes.data) {
				setCommentPhotos(imagesRes.data.images);
			}

			setLoadedForCode(goal.code);
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [goal.code]);

	const handleLoadMore = async () => {
		if (!commentsNextPage || isLoadingMore) return;
		setIsLoadingMore(true);
		const res = await getMoreComments(goal.code, commentsNextPage);
		if (res.success && res.data) {
			appendComments(res.data.comments);
			setHasMoreComments(res.data.hasMore ?? (res.data as any).has_more ?? false);
			setCommentsNextPage(res.data.nextPage ?? (res.data as any).next_page ?? null);
		}
		setIsLoadingMore(false);
	};

	const handleEditMyReview = (comment: IComment) => {
		setModalProps({editComment: comment});
		setWindow('add-review');
		setIsOpen(true);
	};

	const handleDeleteMyReview = (comment: IComment) => {
		setFuncModal(async () => {
			const res = await deleteReview(comment.id);
			if (res.success) {
				setMyComment(null);
				return true;
			}
			return false;
		});
		setModalProps({});
		setWindow('delete-review');
		setIsOpen(true);
	};

	const handleScoreMyReview = async (id: number, like: boolean) => {
		if (!myComment) return;
		const res = await postLikeComment(id, like);
		if (res.success) {
			setMyComment({...myComment, ...res.data});
		}
	};

	const isCommentsFresh = loadedForCode === goal.code;

	const getGoalContent = () => {
		switch (page) {
			case 'isGoal':
				if (!isCommentsFresh) {
					return <CommentsGoalSkeleton />;
				}
				return (
					<>
						{myComment && (
							<div className={element('my-review-wrap')}>
								<MyReview
									comment={myComment}
									onEdit={handleEditMyReview}
									onDelete={handleDeleteMyReview}
									onClickScore={handleScoreMyReview}
								/>
							</div>
						)}
						<CommentsGoal
							comments={comments}
							setComments={setComments}
							canAddReview={goal.addedByUser && goal.completedByUser}
							hasMyComment={!!myComment || goal.hasMyComment}
							hasMore={hasMoreComments}
							isLoadingMore={isLoadingMore}
							onLoadMore={handleLoadMore}
						/>
					</>
				);
			case 'isGoalLists':
				return <ListsWithGoal code={goal.code} onListChanged={onListChanged} />;
			case 'isGoalProgressHistory':
				if (goal.addedByUser && !goal.regularConfig) {
					return <GoalProgressHistory goalId={goal.id} refreshTrigger={historyRefreshTrigger} />;
				}
				return null;
			case 'isGoalHistory':
				if (goal.regularConfig && goal.addedByUser && goal.regularConfig.id) {
					return (
						<RegularGoalHistory
							regularGoalId={goal.regularConfig.id}
							refreshTrigger={historyRefreshTrigger}
							allowCustomSettings={goal.regularConfig.allowCustomSettings}
						/>
					);
				}
				return null;
			case 'isGoalRating':
				if (
					goal.regularConfig &&
					goal.addedByUser &&
					goal.regularConfig.id &&
					goal.regularConfig.durationType === 'indefinite' &&
					!goal.regularConfig.allowCustomSettings
				) {
					return <RegularGoalRating regularGoalId={goal.regularConfig.id} refreshTrigger={historyRefreshTrigger} />;
				}
				return null;
			default:
				return null;
		}
	};

	const goToListsTab = () => {
		const y = window.scrollY;
		navigate(`/goals/${goal.code}/lists`);
		requestAnimationFrame(() => {
			window.scrollTo({top: y});
		});
	};

	const addedViaLists = Array.isArray(goal.addedFromList) ? goal.addedFromList.filter((c) => typeof c === 'string' && c.length > 0) : [];

	return (
		<article className={block()}>
			{goal.createdByUser && goal.catalogReviewStatus && goal.catalogReviewStatus !== 'approved' && (
				<div className={element('moderation-banner')}>
					<CatalogModerationBanner
						catalogReviewStatus={goal.catalogReviewStatus}
						catalogPermanentlyRejected={goal.catalogPermanentlyRejected}
						catalogRejectionCount={goal.catalogRejectionCount}
						catalogRejectionLimit={goal.catalogRejectionLimit}
						catalogRejectionReasons={goal.catalogRejectionReasons}
						catalogRejectionComment={goal.catalogRejectionComment}
						catalogDeleteAt={goal.catalogDeleteAt}
						catalogResubmitAvailableAt={goal.catalogResubmitAvailableAt}
						catalogDuplicateGoalCode={goal.catalogDuplicateGoalCode}
						catalogDuplicateGoalTitle={goal.catalogDuplicateGoalTitle}
						actionText={goal.isCanEdit && onEditClick ? 'Редактировать' : undefined}
						onAction={goal.isCanEdit ? onEditClick : undefined}
					/>
				</div>
			)}
			{addedViaLists && addedViaLists.length > 0 && (
				<div className={element('goal-in-list')}>
					<Banner
						type="info"
						message="Цель включена в список и отображается вместе с ним"
						actionText="Смотреть списки"
						onAction={goToListsTab}
					/>
				</div>
			)}
			<DescriptionWithLinks goal={goal} page={page} />
			{page === 'isGoal' && isCommentsFresh && commentPhotos?.length > 0 && (
				<section className={element('impressions')}>
					<InfoGoal
						size="small"
						items={[
							{
								title: 'Сложность',
								value: <ComplexityDisplay complexity={goal.complexity} />,
							},
						]}
					/>
					<CommentImagesGallery images={commentPhotos} navSuffix="impressions" imageBig />
				</section>
			)}
			<section className={element('comments')} id="comments-section">
				{getGoalContent()}
			</section>
		</article>
	);
});
