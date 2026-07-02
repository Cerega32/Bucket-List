import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {MainComments} from '@/components/MainComments/MainComments';
import {MainCommentsSkeleton} from '@/components/MainComments/MainCommentsSkeleton';
import {MainHeader} from '@/components/MainHeader/MainHeader';
import {MainInfo} from '@/components/MainInfo/MainInfo';
import {MainPopular} from '@/components/MainPopular/MainPopular';
import {MainPopularSkeleton} from '@/components/MainPopular/MainPopularSkeleton';
import {MainPopularLists} from '@/components/MainPopularLists/MainPopularLists';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IComment} from '@/typings/comments';
import {IGoal} from '@/typings/goal';
import {IPage} from '@/typings/page';
import {getPopularCommentsPhoto} from '@/utils/api/get/getPopularCommentsPhoto';
import {getPopularGoalsForAllTime} from '@/utils/api/get/getPopularGoalsForAllTime';
import {getPopularGoalsForDay} from '@/utils/api/get/getPopularGoalsForDay';
import {getTopLikedComments} from '@/utils/api/get/getTopLikedComments';
import {getTotalCompleted} from '@/utils/api/get/getTotalCompleted';

import {Categories} from '../Categories/Categories';
import {FeaturesShowcase} from '../FeaturesShowcase/FeaturesShowcase';

import './main-container.scss';

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
