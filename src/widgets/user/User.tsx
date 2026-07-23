import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

import {getFriendRequests, getFriends} from '@/entities/friend/api/friends';
import {FriendsStore} from '@/entities/friend/model/FriendsStore';
import {getUser} from '@/entities/user/api/getUser';
import {UserStore} from '@/entities/user/model/UserStore';
import {UserInfo} from '@/entities/user/ui/UserInfo/UserInfo';
import {UserInfoSkeleton} from '@/entities/user/ui/UserInfo/UserInfoSkeleton';
import {useBem} from '@/shared/lib/hooks/useBem';
import {IPage} from '@/shared/types/page';
import {User100Goals} from '@/widgets/user-100-goals/User100Goals';
import {UserAchievements} from '@/widgets/user-achievements/UserAchievements';
import {UserGoals} from '@/widgets/user-goals/UserGoals';
import {UserShowcase} from '@/widgets/user-showcase/UserShowcase';
import '@/widgets/user/user.scss';

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
