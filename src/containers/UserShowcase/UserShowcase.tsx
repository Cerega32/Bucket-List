import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {Button} from '@/components/Button/Button';
import {CommentsGoal} from '@/components/CommentsGoal/CommentsGoal';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {Loader} from '@/components/Loader/Loader';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IAchievement} from '@/typings/achievements';
import {get100Goals} from '@/utils/api/get/get100Goals';
import {getUserImpressionImages, getUserInitialComments, getUserMoreComments} from '@/utils/api/get/getComments';
import {GET} from '@/utils/fetch/requests';
import './user-showcase.scss';

interface UserShowcaseProps {
	id: string;
}

export const UserShowcase: FC<UserShowcaseProps> = observer((props) => {
	const {id} = props;
	const [block, element] = useBem('user-showcase');

	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const {
		mainGoals,
		setMainGoals,
		mainGoalsLoadedForId,
		setMainGoalsLoadedForId,
		showcaseLoadedForId,
		setShowcaseLoadedForId,
		showcaseComments,
		setShowcaseComments,
		appendShowcaseComments,
		showcaseCommentPhotos,
		setShowcaseCommentPhotos,
		showcaseHasMoreComments,
		setShowcaseHasMoreComments,
		showcaseCommentsNextPage,
		setShowcaseCommentsNextPage,
		showcaseAchievementsPreview,
		setShowcaseAchievementsPreview,
	} = UserStore;

	useEffect(() => {
		if (showcaseLoadedForId === id && mainGoalsLoadedForId === id) return undefined;

		let cancelled = false;
		const needShowcase = showcaseLoadedForId !== id;
		const needMainGoals = mainGoalsLoadedForId !== id;

		if (needShowcase) {
			setShowcaseLoadedForId(null);
			setShowcaseComments([]);
			setShowcaseCommentPhotos([]);
			setShowcaseHasMoreComments(false);
			setShowcaseCommentsNextPage(null);
			setShowcaseAchievementsPreview([]);
		}
		if (needMainGoals) {
			setMainGoalsLoadedForId(null);
			setMainGoals({
				easyGoals: {data: [], countCompleted: 0},
				mediumGoals: {data: [], countCompleted: 0},
				hardGoals: {data: [], countCompleted: 0},
			});
		}

		(async () => {
			const [goalsRes, achievementsRes, commentsRes, imagesRes] = await Promise.all([
				needMainGoals ? get100Goals(id) : Promise.resolve(null),
				needShowcase ? GET('achievements', {get: {user_id: id}}) : Promise.resolve(null),
				needShowcase ? getUserInitialComments(id) : Promise.resolve(null),
				needShowcase ? getUserImpressionImages(id) : Promise.resolve(null),
			]);
			if (cancelled) return;

			if (goalsRes && goalsRes.success) {
				setMainGoals(goalsRes.data);
				setMainGoalsLoadedForId(id);
			}
			if (achievementsRes && achievementsRes.success) {
				const achieved = achievementsRes.data.data.filter((achievement: IAchievement) => achievement.isAchieved).slice(0, 3);
				setShowcaseAchievementsPreview(achieved);
			}
			if (commentsRes && commentsRes.success && commentsRes.data) {
				setShowcaseComments(commentsRes.data.comments);
				setShowcaseHasMoreComments(commentsRes.data.hasMore ?? (commentsRes.data as any).has_more ?? false);
				setShowcaseCommentsNextPage(commentsRes.data.nextPage ?? (commentsRes.data as any).next_page ?? null);
			}
			if (imagesRes && imagesRes.success && imagesRes.data) {
				setShowcaseCommentPhotos(imagesRes.data.images);
			}
			if (needShowcase) {
				setShowcaseLoadedForId(id);
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const handleLoadMore = async () => {
		if (!showcaseCommentsNextPage || isLoadingMore) return;
		setIsLoadingMore(true);
		const res = await getUserMoreComments(id, showcaseCommentsNextPage);
		if (res.success && res.data) {
			appendShowcaseComments(res.data.comments);
			setShowcaseHasMoreComments(res.data.hasMore ?? (res.data as any).has_more ?? false);
			setShowcaseCommentsNextPage(res.data.nextPage ?? (res.data as any).next_page ?? null);
		}
		setIsLoadingMore(false);
	};

	const isFresh = showcaseLoadedForId === id && mainGoalsLoadedForId === id;

	if (!isFresh) {
		return <Loader isLoading className={block()} />;
	}

	return (
		<Loader isLoading={false} className={block()}>
			<CommentsGoal
				comments={showcaseComments}
				setComments={setShowcaseComments}
				isUser
				isShowcase
				showcasePhotos={showcaseCommentPhotos}
				hasMore={showcaseHasMoreComments}
				isLoadingMore={isLoadingMore}
				onLoadMore={handleLoadMore}
				className={element('comment')}
			/>
			<aside className={element('sidebar')}>
				<div className={element('title')}>
					<Title tag="h2">100 целей</Title>
					<Button theme="blue-light" size="small" type="Link" href={`/user/${id}/100-goal`}>
						Смотреть все
					</Button>
				</div>
				<Info100Goals
					className={element('stats')}
					totalAddedEasy={mainGoals.easyGoals.data.length}
					totalAddedMedium={mainGoals.mediumGoals.data.length}
					totalAddedHard={mainGoals.hardGoals.data.length}
					totalCompletedEasy={mainGoals.easyGoals.countCompleted}
					totalCompletedMedium={mainGoals.mediumGoals.countCompleted}
					totalCompletedHard={mainGoals.hardGoals.countCompleted}
					column
				/>
				<div className={element('title')}>
					<Title tag="h2">Достижения</Title>
					<Button theme="blue-light" size="small" type="Link" href={`/user/${id}/achievements`}>
						Смотреть все
					</Button>
				</div>
				{showcaseAchievementsPreview.length === 0 ? (
					<EmptyState
						title="Пока нет достижений"
						description="Выполняйте цели, чтобы получать достижения"
						size="small"
						className={element('empty-achievements')}
					/>
				) : (
					showcaseAchievementsPreview.map((achievement) => (
						<Achievement key={achievement.id} className={element('achievement')} achievement={achievement} />
					))
				)}
			</aside>
		</Loader>
	);
});
