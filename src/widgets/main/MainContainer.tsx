import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {getPopularCommentsPhoto} from '@/entities/comment/api/getPopularCommentsPhoto';
import {getTopLikedComments} from '@/entities/comment/api/getTopLikedComments';
import {IComment} from '@/entities/comment/model/types';
import {getPopularGoalsForAllTime} from '@/entities/goal/api/getPopularGoalsForAllTime';
import {getPopularGoalsForDay} from '@/entities/goal/api/getPopularGoalsForDay';
import {getTotalCompleted} from '@/entities/goal/api/getTotalCompleted';
import {IGoal} from '@/entities/goal/model/types';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {IPage} from '@/shared/types/page';
import {Categories} from '@/widgets/categories/Categories';
import {FeaturesShowcase} from '@/widgets/features-showcase/FeaturesShowcase';
import {MainComments} from '@/widgets/main-comments/MainComments';
import {MainCommentsSkeleton} from '@/widgets/main-comments/MainCommentsSkeleton';
import {MainHeader} from '@/widgets/main-header/MainHeader';
import {MainInfo} from '@/widgets/main-info/MainInfo';
import {MainPopular} from '@/widgets/main-popular/MainPopular';
import {MainPopularSkeleton} from '@/widgets/main-popular/MainPopularSkeleton';
import {MainPopularLists} from '@/widgets/main-popular-lists/MainPopularLists';

import '@/widgets/main/main-container.scss';

const MAIN_PAGE_PHOTOS_LIMIT = 40;
const MAIN_PAGE_HEADER_PHOTOS_PER_COLUMN = 20;
const MAIN_PAGE_COMMENTS_LIMIT = 20;

const MainContainerComponent: FC<IPage> = () => {
	const [block] = useBem('main-container');
	const {isAuth} = UserStore;
	const [headerLeftPhotos, setHeaderLeftPhotos] = useState<IComment[]>([]);
	const [headerRightPhotos, setHeaderRightPhotos] = useState<IComment[]>([]);
	const [popularGoalsForDay, setPopularGoalsForDay] = useState<IGoal[]>([]);
	const [popularGoalsForAllTime, setPopularGoalsForAllTime] = useState<IGoal[]>([]);
	const [commentsTopLiked, setCommentsTopLiked] = useState<IComment[]>([]);
	const [totalCompleted, setTotalCompleted] = useState<number>(0);

	const [photosLoading, setPhotosLoading] = useState(true);
	const [popularDayLoading, setPopularDayLoading] = useState(true);
	const [popularAllTimeLoading, setPopularAllTimeLoading] = useState(true);
	const [totalLoading, setTotalLoading] = useState(true);
	const [commentsLoading, setCommentsLoading] = useState(true);

	const getPhoto = async () => {
		setPhotosLoading(true);
		const response = await getPopularCommentsPhoto(MAIN_PAGE_PHOTOS_LIMIT);
		if (response.success) {
			setHeaderLeftPhotos(response.data.leftPhotos ?? response.data.photos.slice(0, MAIN_PAGE_HEADER_PHOTOS_PER_COLUMN));
			setHeaderRightPhotos(
				response.data.rightPhotos ?? response.data.photos.slice(MAIN_PAGE_HEADER_PHOTOS_PER_COLUMN, MAIN_PAGE_PHOTOS_LIMIT)
			);
		}
		setPhotosLoading(false);
	};

	const getGoals = async () => {
		setPopularDayLoading(true);
		const response = await getPopularGoalsForDay();
		if (response.success) {
			setPopularGoalsForDay(response.data);
		}
		setPopularDayLoading(false);
	};

	const getGoalsForAllTime = async () => {
		setPopularAllTimeLoading(true);
		const response = await getPopularGoalsForAllTime();
		if (response.success) {
			setPopularGoalsForAllTime(response.data);
		}
		setPopularAllTimeLoading(false);
	};

	const getTotal = async () => {
		setTotalLoading(true);
		const response = await getTotalCompleted();
		if (response.success) {
			setTotalCompleted(response.data.totalCompletedGoals);
		}
		setTotalLoading(false);
	};

	const getComments = async () => {
		setCommentsLoading(true);
		const response = await getTopLikedComments(MAIN_PAGE_COMMENTS_LIMIT);
		if (response.success) {
			setCommentsTopLiked(response.data);
		}
		setCommentsLoading(false);
	};

	useEffect(() => {
		getPhoto();
		getGoals();
		getGoalsForAllTime();
		getComments();
		getTotal();
	}, [isAuth]);

	const popularLoading = popularDayLoading || popularAllTimeLoading;

	return (
		<div className={block()}>
			<MainHeader
				leftPhotos={headerLeftPhotos}
				rightPhotos={headerRightPhotos}
				totalCompleted={totalCompleted}
				isPhotosLoading={photosLoading}
				isCounterLoading={totalLoading}
			/>
			<MainInfo />
			<FeaturesShowcase />
			{popularLoading ? (
				<MainPopularSkeleton />
			) : (
				<MainPopular goalsForDay={popularGoalsForDay} goalsForAllTime={popularGoalsForAllTime} />
			)}
			<MainPopularLists />
			{commentsLoading ? <MainCommentsSkeleton /> : <MainComments comments={commentsTopLiked} />}
			<Categories tag="h2" title="Что тебе интересно?" />
		</div>
	);
};

export const MainContainer = observer(MainContainerComponent);
