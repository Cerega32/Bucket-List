import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {scroller} from 'react-scroll';

import './content-goal.scss';

import {useBem} from '@/hooks/useBem';
import {GoalStore} from '@/store/GoalStore';
import {ModalStore} from '@/store/ModalStore';
import {IComment} from '@/typings/comments';
import {IGoal} from '@/typings/goal';
import {deleteReview} from '@/utils/api/delete/deleteReview';
import {getCommentsWithImages} from '@/utils/api/get/getComments';
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
	historyRefreshTrigger?: number; // Триггер для обновления истории выполнения
}

export const ContentGoal: FC<ContentGoalProps> = observer((props) => {
	const {className, goal, page, historyRefreshTrigger} = props;

	const [block, element] = useBem('content-goal', className);
	const navigate = useNavigate();

	const {comments, setComments, setInfoPaginationComments, commentPhotos, setCommentPhotos} = GoalStore;
	const {setIsOpen, setWindow, setModalProps, setFuncModal} = ModalStore;

	const currentUserId = parseInt(Cookies.get('user-id') || '0', 10);
	const myComment = comments.find((c) => c.user === currentUserId) ?? null;
	const otherComments = myComment ? comments.filter((c) => c.id !== myComment.id) : comments;

	useEffect(() => {
		if (page === 'isGoal') {
			(async () => {
				const res = await getCommentsWithImages(goal.code);

				if (res.success && res.data) {
					setComments(res.data.data);
					setInfoPaginationComments(res.data.pagination);
					// popular_images – snake_case (бэкенд после наших прав),
					// popularImages – camelCase (старый/другой контракт). Поддерживаем оба варианта.
					const images = (res.data as any).popular_images || (res.data as any).popularImages || [];
					setCommentPhotos(images);
				}
			})();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [goal.code, page]);

	const handleEditMyReview = (comment: IComment) => {
		setModalProps({editComment: comment});
		setWindow('add-review');
		setIsOpen(true);
	};

	const handleDeleteMyReview = (comment: IComment) => {
		setFuncModal(async () => {
			const res = await deleteReview(comment.id);
			if (res.success) {
				setComments(comments.filter((c) => c.id !== comment.id));
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
			const idx = comments.findIndex((c) => c.id === myComment.id);
			if (idx !== -1) {
				const next = [...comments];
				next[idx] = {...next[idx], ...res.data};
				setComments(next);
			}
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
							comments={otherComments}
							setComments={setComments}
							canAddReview={goal.addedByUser && goal.completedByUser}
							hasAnyComments={!!myComment}
						/>
					</>
				);
			case 'isGoalLists':
				return <ListsWithGoal code={goal.code} />;
			case 'isGoalProgressHistory':
				if (goal.addedByUser && !goal.regularConfig) {
					return <GoalProgressHistory goalId={goal.id} refreshTrigger={historyRefreshTrigger} />;
				}
				return null;
			case 'isGoalHistory':
				// Показываем историю только если цель регулярная и добавлена пользователем
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
				// Показываем рейтинг только если цель регулярная, бессрочная и добавлена пользователем
				if (goal.regularConfig && goal.addedByUser && goal.regularConfig.id && goal.regularConfig.durationType === 'indefinite') {
					return <RegularGoalRating regularGoalId={goal.regularConfig.id} />;
				}
				return null;
			default:
				return null;
		}
	};

	const scrollToComments = () => {
		navigate(`/goals/${goal.code}/lists`);
		scroller.scrollTo('comments-section', {
			duration: 800,
			delay: 0,
			smooth: 'easeInOutQuart',
			offset: -50,
		});
	};

	return (
		<article className={block()}>
			{goal.addedFromList && goal.addedFromList.length > 0 && (
				<div className={element('goal-in-list')}>
					<Banner
						type="info"
						message="Цель включена в список и отображается вместе с ним"
						actionText="Смотреть списки"
						onAction={scrollToComments}
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
