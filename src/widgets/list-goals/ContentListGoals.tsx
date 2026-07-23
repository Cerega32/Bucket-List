import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {deleteReview} from '@/entities/comment/api/deleteReview';
import {getInitialListComments, getListImpressionImages, getMoreListComments} from '@/entities/comment/api/getComments';
import {postLikeComment} from '@/entities/comment/api/postLikeComment';
import {IComment} from '@/entities/comment/model/types';
import {CommentImagesGallery} from '@/entities/comment/ui/CommentImagesGallery/CommentImagesGallery';
import {CommentsGoal} from '@/entities/comment/ui/CommentsGoal/CommentsGoal';
import {CommentsGoalSkeleton} from '@/entities/comment/ui/CommentsGoal/CommentsGoalSkeleton';
import {MyReview} from '@/entities/comment/ui/MyReview/MyReview';
import {GoalStore} from '@/entities/goal/model/GoalStore';
import {ComplexityDisplay} from '@/entities/goal/ui/ComplexityDisplay/ComplexityDisplay';
import {DescriptionWithLinks} from '@/entities/goal/ui/DescriptionWithLinks/DescriptionWithLinks';
import {InfoGoal} from '@/entities/goal/ui/InfoGoal/InfoGoal';
import {TitleWithTags} from '@/entities/goal/ui/TitleWithTags/TitleWithTags';
import {IList} from '@/entities/goal-list/model/types';
import {CatalogModerationBanner} from '@/features/catalog-moderation-banner/CatalogModerationBanner';
import {useBem} from '@/shared/lib/hooks/useBem';
import useScreenSize from '@/shared/lib/hooks/useScreenSize';
import {ModalStore} from '@/shared/model/ModalStore';
import {ListGoals} from '@/widgets/list-goals/ListGoals';
import {ListGoalsFilters} from '@/widgets/list-goals-filters/ListGoalsFilters';

import '@/widgets/list-goals/content-list-goals.scss';

interface ContentListGoalsProps {
	className?: string;
	list: IList;
	page: string;
	search: string;
	onSearchChange: (query: string) => void;
	updateGoal: (code: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean) => Promise<void | boolean>;
	onMyCommentChange?: (hasComment: boolean) => void;
}

export const ContentListGoals: FC<ContentListGoalsProps> = observer((props) => {
	const {className, list, page, search, onSearchChange, updateGoal, onMyCommentChange} = props;

	const {isScreenTablet, isScreenDesktop, isScreenSmallTablet} = useScreenSize();
	const [block, element] = useBem('content-list-goals', className);
	const navigate = useNavigate();
	const {setIsOpen, setWindow, setModalProps, setFuncModal} = ModalStore;
	const {
		comments,
		setComments,
		appendComments,
		myComment,
		setMyComment,
		commentPhotos,
		setCommentPhotos,
		hasMoreComments,
		setHasMoreComments,
		commentsNextPage,
		setCommentsNextPage,
		setGoalListId,
	} = GoalStore;

	const [loadedForCode, setLoadedForCode] = useState<string | null>(null);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const filteredGoalsCount = list.goalsPagination?.totalGoals ?? list.goals.length;
	const isCommentsFresh = loadedForCode === list.code;
	const isImpressionsTab = page === 'isListImpressions';

	useEffect(() => {
		let cancelled = false;
		setGoalListId(list.id);
		setLoadedForCode(null);
		setComments([]);
		setMyComment(null);
		setCommentPhotos([]);
		setHasMoreComments(false);
		setCommentsNextPage(null);

		(async () => {
			const [commentsRes, imagesRes] = await Promise.all([getInitialListComments(list.code), getListImpressionImages(list.code)]);
			if (cancelled) return;

			if (commentsRes.success) {
				setMyComment(commentsRes.data.myComment);
				setComments(commentsRes.data.comments);
				setHasMoreComments(commentsRes.data.hasMore);
				setCommentsNextPage(commentsRes.data.nextPage ?? (commentsRes.data as {next_page?: number | null}).next_page ?? null);
				onMyCommentChange?.(!!commentsRes.data.myComment);
			}
			if (imagesRes.success) {
				setCommentPhotos(imagesRes.data.images);
			}
			setLoadedForCode(list.code);
		})();

		return () => {
			cancelled = true;
			setGoalListId(null);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [list.code, list.id]);

	const handleLoadMore = async () => {
		if (!commentsNextPage || isLoadingMore) return;
		setIsLoadingMore(true);
		const res = await getMoreListComments(list.code, commentsNextPage);
		if (res.success) {
			appendComments(res.data.comments);
			setHasMoreComments(res.data.hasMore);
			setCommentsNextPage(res.data.nextPage ?? (res.data as {next_page?: number | null}).next_page ?? null);
		}
		setIsLoadingMore(false);
	};

	const openAddReview = () => {
		setModalProps({
			goalListId: list.id,
			onReviewAdded: () => onMyCommentChange?.(true),
			onReviewRemoved: () => onMyCommentChange?.(false),
		});
		setWindow('add-review');
		setIsOpen(true);
	};

	const handleEditMyReview = (comment: IComment) => {
		setModalProps({
			editComment: comment,
			goalListId: list.id,
			onReviewAdded: () => onMyCommentChange?.(true),
			onReviewRemoved: () => onMyCommentChange?.(false),
		});
		setWindow('add-review');
		setIsOpen(true);
	};

	const handleDeleteMyReview = (comment: IComment) => {
		setFuncModal(async () => {
			const res = await deleteReview(comment.id);
			if (res.success) {
				setMyComment(null);
				onMyCommentChange?.(false);
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

	return (
		<article className={block()}>
			{list.createdByUser && list.catalogReviewStatus && list.catalogReviewStatus !== 'approved' && (
				<div className={element('moderation-banner')}>
					<CatalogModerationBanner
						catalogReviewStatus={list.catalogReviewStatus}
						catalogPermanentlyRejected={list.catalogPermanentlyRejected}
						catalogRejectionCount={list.catalogRejectionCount}
						catalogRejectionLimit={list.catalogRejectionLimit}
						catalogRejectionReasons={list.catalogRejectionReasons}
						catalogRejectionComment={list.catalogRejectionComment}
						catalogDeleteAt={list.catalogDeleteAt}
						catalogResubmitAvailableAt={list.catalogResubmitAvailableAt}
						actionText={list.isCanEdit ? 'Редактировать' : undefined}
						onAction={list.isCanEdit ? () => navigate(`/edit-list/${list.code}`) : undefined}
					/>
				</div>
			)}
			{(isScreenDesktop || (isScreenTablet && !isScreenSmallTablet)) && (
				<TitleWithTags
					title={list.title}
					category={list.category}
					complexity={list.complexity}
					className={element('title')}
					totalCompleted={list.totalCompleted}
					isList
					theme="light"
					listTotal={list.goalsCount}
				/>
			)}
			<DescriptionWithLinks isList goal={list} page={page} className={element('description')} />
			{list.addedByUser && (
				<InfoGoal
					className={element('info')}
					items={[]}
					progress
					horizontal
					progressData={{
						completed: list.userCompletedGoals,
						total: list.goalsCount,
					}}
				/>
			)}

			{isImpressionsTab ? (
				<>
					{isCommentsFresh && commentPhotos?.length > 0 && (
						<section className={element('impressions')}>
							<InfoGoal
								size="small"
								items={[
									{
										title: 'Сложность',
										value: <ComplexityDisplay complexity={list.complexity} />,
									},
								]}
							/>
							<CommentImagesGallery images={commentPhotos} navSuffix="list-impressions" imageBig />
						</section>
					)}
					<section className={element('comments')} id="comments-section">
						{!isCommentsFresh ? (
							<CommentsGoalSkeleton />
						) : (
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
									canAddReview={list.addedByUser && list.completedByUser}
									hasMyComment={!!myComment || !!list.hasMyComment}
									hasMore={hasMoreComments}
									isLoadingMore={isLoadingMore}
									onLoadMore={handleLoadMore}
									onAddReview={openAddReview}
								/>
							</>
						)}
					</section>
				</>
			) : (
				<>
					<ListGoalsFilters
						className={element('filters')}
						search={search}
						onSearchChange={onSearchChange}
						totalCount={filteredGoalsCount}
					/>
					<ListGoals list={list.goals} updateGoal={updateGoal} columns="three" searchQuery={search} />
				</>
			)}
		</article>
	);
});
