import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo, useState} from 'react';

import {getUserAchievements} from '@/entities/achievement/api/getUserAchievements';
import {IAchievement} from '@/entities/achievement/model/types';
import {Achievement} from '@/entities/achievement/ui/Achievement/Achievement';
import {getUserImpressionImages, getUserInitialComments, getUserMoreComments, UserCommentsSortBy} from '@/entities/comment/api/getComments';
import {CommentsGoal} from '@/entities/comment/ui/CommentsGoal/CommentsGoal';
import {get100Goals} from '@/entities/goal/api/get100Goals';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Button} from '@/shared/ui/Button/Button';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';
import {OptionSelect} from '@/shared/ui/Select/Select';
import {Title} from '@/shared/ui/Title/Title';
import {Info100Goals} from '@/widgets/info-100-goals/Info100Goals';
import {UserShowcaseSkeleton} from '@/widgets/user-showcase/UserShowcaseSkeleton';
import '@/widgets/user-showcase/user-showcase.scss';

interface UserShowcaseProps {
	id: string;
}

const SHOWCASE_SORT_OPTIONS: Array<OptionSelect> = [
	{name: 'Новые', value: '-date_created'},
	{name: 'Популярные', value: '-likes_count'},
	{name: 'Старые', value: 'date_created'},
	{name: 'С фото', value: 'with_photos'},
];

export const UserShowcase: FC<UserShowcaseProps> = observer((props) => {
	const {id} = props;
	const [block, element] = useBem('user-showcase');

	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isSorting, setIsSorting] = useState(false);

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
		showcaseCommentsSort,
		setShowcaseCommentsSort,
		showcaseAchievementsPreview,
		setShowcaseAchievementsPreview,
	} = UserStore;

	const activeSort = useMemo(() => {
		const index = SHOWCASE_SORT_OPTIONS.findIndex((option) => option.value === showcaseCommentsSort);
		return index >= 0 ? index : 0;
	}, [showcaseCommentsSort]);

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
			setShowcaseCommentsSort('-date_created');
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
				needShowcase ? getUserAchievements(id) : Promise.resolve(null),
				needShowcase ? getUserInitialComments(id, '-date_created') : Promise.resolve(null),
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

	const handleSortChange = async (active: number) => {
		const nextSort = SHOWCASE_SORT_OPTIONS[active]?.value as UserCommentsSortBy | undefined;
		if (!nextSort || nextSort === showcaseCommentsSort || isSorting) return;

		setIsSorting(true);
		setShowcaseCommentsSort(nextSort);

		const res = await getUserInitialComments(id, nextSort);
		if (res.success && res.data) {
			setShowcaseComments(res.data.comments);
			setShowcaseHasMoreComments(res.data.hasMore ?? (res.data as any).has_more ?? false);
			setShowcaseCommentsNextPage(res.data.nextPage ?? (res.data as any).next_page ?? null);
		}
		setIsSorting(false);
	};

	const handleLoadMore = async () => {
		if (!showcaseCommentsNextPage || isLoadingMore) return;
		setIsLoadingMore(true);
		const res = await getUserMoreComments(id, showcaseCommentsNextPage, showcaseCommentsSort);
		if (res.success && res.data) {
			appendShowcaseComments(res.data.comments);
			setShowcaseHasMoreComments(res.data.hasMore ?? (res.data as any).has_more ?? false);
			setShowcaseCommentsNextPage(res.data.nextPage ?? (res.data as any).next_page ?? null);
		}
		setIsLoadingMore(false);
	};

	const isFresh = showcaseLoadedForId === id && mainGoalsLoadedForId === id;

	if (!isFresh) {
		return <UserShowcaseSkeleton className={block()} />;
	}

	return (
		<div className={block()}>
			<CommentsGoal
				comments={showcaseComments}
				setComments={setShowcaseComments}
				isUser
				isShowcase
				showcasePhotos={showcaseCommentPhotos}
				hasMore={showcaseHasMoreComments}
				isLoadingMore={isLoadingMore || isSorting}
				onLoadMore={handleLoadMore}
				sortOptions={SHOWCASE_SORT_OPTIONS}
				activeSort={activeSort}
				isSorting={isSorting}
				onSortChange={handleSortChange}
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
		</div>
	);
});
