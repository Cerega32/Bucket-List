import {FC, useEffect, useState} from 'react';

import {Loader} from '@/components/Loader/Loader';
import {MainComments} from '@/components/MainComments/MainComments';
import {MainHeader} from '@/components/MainHeader/MainHeader';
import {MainInfo} from '@/components/MainInfo/MainInfo';
import {MainPopular} from '@/components/MainPopular/MainPopular';
import {useBem} from '@/hooks/useBem';
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

export const MainContainer: FC<IPage> = () => {
	const [block] = useBem('main-container');
	const [isLoading, setIsLoading] = useState(0);
	const [popularCommentsPhoto, setPopularCommentsPhoto] = useState<IComment[]>([]);
	const [popularGoalsForDay, setPopularGoalsForDay] = useState<IGoal[]>([]);
	const [popularGoalsForAllTime, setPopularGoalsForAllTime] = useState<IGoal[]>([]);
	const [commentsTopLiked, setCommentsTopLiked] = useState<IComment[]>([]);
	const [totalCompleted, setTotalCompleted] = useState<number>(0);

	const getPhoto = async () => {
		setIsLoading((prev) => prev + 1);
		const response = await getPopularCommentsPhoto();
		if (response.success) {
			setPopularCommentsPhoto(response.data.photos);
		}
		setIsLoading((prev) => prev - 1);
	};

	const getGoals = async () => {
		setIsLoading((prev) => prev + 1);
		const response = await getPopularGoalsForDay();
		if (response.success) {
			setPopularGoalsForDay(response.data);
		}
		setIsLoading((prev) => prev - 1);
	};

	const getGoalsForAllTime = async () => {
		setIsLoading((prev) => prev + 1);
		const response = await getPopularGoalsForAllTime();
		if (response.success) {
			setPopularGoalsForAllTime(response.data);
		}
		setIsLoading((prev) => prev - 1);
	};

	const getTotal = async () => {
		setIsLoading((prev) => prev + 1);
		const response = await getTotalCompleted();
		if (response.success) {
			setTotalCompleted(response.data.totalCompletedGoals);
		}
		setIsLoading((prev) => prev - 1);
	};

	const getComments = async () => {
		setIsLoading((prev) => prev + 1);
		const response = await getTopLikedComments();
		if (response.success) {
			setCommentsTopLiked(response.data);
		}
		setIsLoading((prev) => prev - 1);
	};

	useEffect(() => {
		getPhoto();
		getGoals();
		getGoalsForAllTime();
		getComments();
		getTotal();
	}, []);

	return (
		<Loader isLoading={!isLoading} className={block()}>
			<MainHeader
				leftPhotos={popularCommentsPhoto.slice(0, 10)}
				rightPhotos={popularCommentsPhoto.slice(10, 20)}
				totalCompleted={totalCompleted}
			/>
			<MainPopular goalsForDay={popularGoalsForDay} goalsForAllTime={popularGoalsForAllTime} />
			<MainInfo />
			<MainComments comments={[...commentsTopLiked, ...commentsTopLiked]} />
			<Categories tag="h2" title="Что тебе интересно?" />
		</Loader>
	);
};
