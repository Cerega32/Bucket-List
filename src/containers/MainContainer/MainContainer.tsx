import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {MainComments} from '@/components/MainComments/MainComments';
import {MainCommentsSkeleton} from '@/components/MainComments/MainCommentsSkeleton';
import {MainHeader} from '@/components/MainHeader/MainHeader';
import {MainInfo} from '@/components/MainInfo/MainInfo';
import {MainPopular} from '@/components/MainPopular/MainPopular';
import {MainPopularSkeleton} from '@/components/MainPopular/MainPopularSkeleton';
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

import './main-container.scss';

const MainContainerComponent: FC<IPage> = () => {
	const [block] = useBem('main-container');
	const {isAuth} = UserStore;
	const [popularCommentsPhoto, setPopularCommentsPhoto] = useState<IComment[]>([]);
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
		const response = await getPopularCommentsPhoto();
		if (response.success) {
			setPopularCommentsPhoto(response.data.photos);
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
		const response = await getTopLikedComments();
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
				leftPhotos={popularCommentsPhoto.slice(0, 10)}
				rightPhotos={popularCommentsPhoto.slice(10, 20)}
				totalCompleted={totalCompleted}
				isPhotosLoading={photosLoading}
				isCounterLoading={totalLoading}
			/>
			{popularLoading ? (
				<MainPopularSkeleton />
			) : (
				<MainPopular goalsForDay={popularGoalsForDay} goalsForAllTime={popularGoalsForAllTime} />
			)}
			<MainInfo />
			{commentsLoading ? <MainCommentsSkeleton /> : <MainComments comments={[...commentsTopLiked, ...commentsTopLiked]} />}
			<Categories tag="h2" title="Что тебе интересно?" />
		</div>
	);
};

export const MainContainer = observer(MainContainerComponent);
