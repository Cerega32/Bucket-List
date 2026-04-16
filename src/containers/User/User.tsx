import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

import {UserInfo} from '@/components/UserInfo/UserInfo';
import {UserInfoSkeleton} from '@/components/UserInfo/UserInfoSkeleton';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';
import {getFriendRequests, getFriends} from '@/utils/api/friends';
import {getUser} from '@/utils/api/get/getUser';
import './user.scss';

import {User100Goals} from '../User100Goals/User100Goals';
import {UserAchievements} from '../UserAchievements/UserAchievements';
import {UserGoals} from '../UserGoals/UserGoals';
import {UserShowcase} from '../UserShowcase/UserShowcase';

export const User: FC<IPage> = observer(({page, subPage}) => {
	const [block] = useBem('user');

	const {userInfo, userInfoLoadedForId} = UserStore;
	const {id} = useParams();
	const [hasVisited, setHasVisited] = useState(false);

	if (!id) {
		return null;
	}

	useEffect(() => {
		if (UserStore.userInfoLoadedForId === id) {
			return undefined;
		}
		let cancelled = false;
		UserStore.resetUserInfo();
		(async () => {
			await getUser(id);
			if (cancelled) return;
			UserStore.setUserInfoLoadedForId(id);

			// Ленивая загрузка списка друзей и заявок,
			// чтобы корректно отображать состояние кнопки дружбы
			try {
				if (FriendsStore.friends.length === 0) {
					const friendsResponse = await getFriends();
					if (cancelled) return;
					FriendsStore.setFriends(friendsResponse.results);
				}

				if (FriendsStore.friendRequests.length === 0) {
					const requestsResponse = await getFriendRequests();
					if (cancelled) return;
					FriendsStore.setFriendRequests(requestsResponse.results);
				}
			} catch (error) {
				// Если не удалось загрузить друзей/заявки, не блокируем загрузку профиля
				// eslint-disable-next-line no-console
				console.error('Не удалось загрузить список друзей или заявок:', error);
			}

			if (cancelled) return;
			// Обновляем прогресс заданий при посещении профиля (только один раз за сессию)
			if (!hasVisited) {
				// Прогресс заданий обновляется автоматически на бэкенде
				setHasVisited(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id, hasVisited]);

	const getUserContent = () => {
		switch (page) {
			case 'isUserShowcase':
				return <UserShowcase id={id} />;
			case 'isUser100Goals':
				return <User100Goals id={id} />;
			case 'isUserActiveGoals':
				return <UserGoals id={id} subPage={subPage || ''} />;
			case 'isUserDoneGoals':
				return <UserGoals id={id} subPage={subPage || ''} completed />;
			case 'isUserAchievements':
				return <UserAchievements id={id} />;
			default:
				return null;
		}
	};

	const isUserLoaded = !!userInfo.id && userInfo.id !== 0 && userInfoLoadedForId === id;

	return (
		<main className={block()}>
			{isUserLoaded ? (
				<UserInfo
					avatar={userInfo.avatar || null}
					name={userInfo.name || userInfo.username}
					firstName={userInfo.firstName}
					lastName={userInfo.lastName}
					country={userInfo.country}
					about={userInfo.aboutMe}
					totalAdded={userInfo.totalAddedGoals}
					totalCompleted={userInfo.totalCompletedGoals}
					page={page}
					id={id}
					totalAddedLists={userInfo.totalAddedLists}
					totalCompletedLists={userInfo.totalCompletedLists}
					totalAchievements={userInfo.totalAchievements}
					background={userInfo.coverImage}
					subscriptionType={userInfo.subscriptionType}
					level={userInfo.level}
				/>
			) : (
				<UserInfoSkeleton />
			)}
			{getUserContent()}
		</main>
	);
});
