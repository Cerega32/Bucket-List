import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import './content-goal.scss';

import {useBem} from '@/hooks/useBem';
import {GoalStore} from '@/store/GoalStore';
import {ModalStore} from '@/store/ModalStore';
import {IComment} from '@/typings/comments';
import {IGoal} from '@/typings/goal';
import {deleteReview} from '@/utils/api/delete/deleteReview';
import {getGoalImpressionImages, getInitialComments, getMoreComments} from '@/utils/api/get/getComments';
import {postLikeComment} from '@/utils/api/post/postLikeComment';

import {Banner} from '../Banner/Banner';
import {CommentImagesGallery} from '../CommentImagesGallery/CommentImagesGallery';
import {CommentsGoal} from '../CommentsGoal/CommentsGoal';
import {ComplexityDisplay} from '../ComplexityDisplay/ComplexityDisplay';
import {DescriptionWithLinks} from '../DescriptionWithLinks/DescriptionWithLinks';
import {GoalProgressHistory} from '../GoalProgressHistory/GoalProgressHistory';
import {InfoGoal} from '../InfoGoal/InfoGoal';
import {ListsWithGoal} from '../ListsWithGoal/ListsWithGoal';
import {MyReview} from '../MyReview/MyReview';
import {RegularGoalHistory} from '../RegularGoalHistory/RegularGoalHistory';
import {RegularGoalRating} from '../RegularGoalRating/RegularGoalRating';

interface ContentGoalProps {
	className?: string;
	goal: IGoal;
	page: string;
	historyRefreshTrigger?: number;
	onListChanged?: () => void;
}

export const ContentGoal: FC<ContentGoalProps> = observer((props) => {
	const {className, goal, page, historyRefreshTrigger, onListChanged} = props;

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

	useEffect(() => {
		if (page !== 'isGoal') return;

		(async () => {
			const [commentsRes, imagesRes] = await Promise.all([getInitialComments(goal.code), getGoalImpressionImages(goal.code)]);

			if (commentsRes.success && commentsRes.data) {
				setMyComment(commentsRes.data.myComment ?? (commentsRes.data as any).my_comment ?? null);
				setComments(commentsRes.data.comments);
				setHasMoreComments(commentsRes.data.hasMore ?? (commentsRes.data as any).has_more ?? false);
				setCommentsNextPage(commentsRes.data.nextPage ?? (commentsRes.data as any).next_page ?? null);
			}

			if (imagesRes.success && imagesRes.data) {
				setCommentPhotos(imagesRes.data.images);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [goal.code, page]);

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

	const getGoalContent = () => {
		switch (page) {
			case 'isGoal':
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
			{page === 'isGoal' && commentPhotos?.length > 0 && (
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
