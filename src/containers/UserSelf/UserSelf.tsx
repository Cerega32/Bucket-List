import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Line} from '@/components/Line/Line';
import {ITabs, Tabs} from '@/components/Tabs/Tabs';
import {useBem} from '@/hooks/useBem';
import UserMapPage from '@/pages/UserMapPage/UserMapPage';
import {FriendsStore} from '@/store/FriendsStore';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';
import {getUser} from '@/utils/api/get/getUser';
import {getGoalFoldersLight, getGoalsInProgress, getRegularGoalStatistics} from '@/utils/api/goals';

import {UserSelfProfile} from './UserSelfProfile';
import {UserSelfAchievements} from '../UserSelfAchievements/UserSelfAchievements';
import {UserSelfDashboard} from '../UserSelfDashboard/UserSelfDashboard';
import {UserSelfFolders} from '../UserSelfFolders/UserSelfFolders';
import {UserSelfFriends} from '../UserSelfFriends/UserSelfFriends';
import {UserSelfGoals} from '../UserSelfGoals/UserSelfGoals';
import {UserSelfProgress} from '../UserSelfProgress/UserSelfProgress';
import {UserSelfRegular} from '../UserSelfRegular/UserSelfRegular';
import {UserSelfSettings} from '../UserSelfSettings/UserSelfSettings';
import {UserSelfSubscription} from '../UserSelfSubscription/UserSelfSubscription';

import type {IPaginationPage} from '@/typings/request';
import type {IRegularGoalStatistics} from '@/utils/api/goals';
import './user-self.scss';

type RegularStatsResponse =
	| IRegularGoalStatistics[]
	| {
			pagination: IPaginationPage;
			data: IRegularGoalStatistics[];
	  };

export const UserSelf: FC<IPage> = observer(({page, subPage}) => {
	const [block, element] = useBem('user-self');
	const [regularGoalsCount, setRegularGoalsCount] = useState(0);
	const [progressGoalsCount, setProgressGoalsCount] = useState(0);
	const [foldersCount, setFoldersCount] = useState(0);

	useEffect(() => {
		(async () => {
			await getUser();

			try {
				const [regularRes, progressRes, foldersRes] = await Promise.all([
					getRegularGoalStatistics(),
					getGoalsInProgress(),
					getGoalFoldersLight(),
				]);

				if (regularRes.success && regularRes.data) {
					const data = regularRes.data as RegularStatsResponse;

					if (Array.isArray(data)) {
						setRegularGoalsCount(data.length);
					} else {
						setRegularGoalsCount(data.pagination.totalItems);
					}
				}

				if (progressRes.success && progressRes.data) {
					setProgressGoalsCount(progressRes.data.length);
				}

				if (foldersRes.success && foldersRes.data) {
					setFoldersCount(foldersRes.data.length);
				}
			} catch {
				// игнорируем ошибки счётчиков
			}
		})();
	}, []);

	const getUserContent = () => {
		switch (page) {
			// case 'isUserShowcase':
			// 	return <UserShowcase id={id} />;
			// case 'isUser100Goals':
			// 	return <User100Goals id={id} />;
			case 'isUserSelfActive':
				return <UserSelfGoals subPage={subPage as string} completed={false} />;
			case 'isUserSelfDone':
				return <UserSelfGoals subPage={subPage as string} completed />;
			case 'isUserSelfSettings':
				return <UserSelfSettings />;
			case 'isUserSelfAchievements':
				return <UserSelfAchievements />;
			case 'isUserSelfFriends':
				return <UserSelfFriends subPage={subPage as string} />;
			case 'isUserSelfFolders':
				return <UserSelfFolders />;
			case 'isUserSelfProgress':
				return <UserSelfProgress />;
			case 'isUserSelfMaps':
				return <UserMapPage />;
			case 'isUserSelfRegular':
				return <UserSelfRegular />;
			case 'isUserSelfSubs':
				return <UserSelfSubscription />;
			default:
				return <UserSelfDashboard />;
		}
	};

	const {userSelf} = UserStore;

	const activeGoalsAndListsCount =
		userSelf.totalAddedGoals + userSelf.totalAddedLists - userSelf.totalCompletedGoals - userSelf.totalCompletedLists;

	const completedGoalsAndListsCount = userSelf.totalCompletedGoals + userSelf.totalCompletedLists;

	const achievementsCount = userSelf.totalAchievements;
	const {friendsCount} = FriendsStore;

	const tabs: Array<ITabs> = [
		{
			url: '/user/self',
			name: 'Дашборд',
			page: 'isUserSelf',
		},
		{
			url: '/user/self/active-goals',
			name: 'Активные цели и списки',
			page: 'isUserSelfActive',
			count: activeGoalsAndListsCount,
		},
		{
			url: '/user/self/progress',
			name: 'Прогресс целей',
			page: 'isUserSelfProgress',
			count: progressGoalsCount,
		},
		{
			url: '/user/self/regular',
			name: 'Регулярные цели',
			page: 'isUserSelfRegular',
			count: regularGoalsCount,
		},
		{
			url: '/user/self/folders',
			name: 'Папки целей',
			page: 'isUserSelfFolders',
			count: foldersCount,
		},
		{
			url: '/user/self/done-goals',
			name: 'Выполненные',
			page: 'isUserSelfDone',
			count: completedGoalsAndListsCount,
		},
		{
			url: '/user/self/maps',
			name: 'Мои карты',
			page: 'isUserSelfMaps',
		},
		{
			url: '/user/self/achievements',
			name: 'Достижения',
			page: 'isUserSelfAchievements',
			count: achievementsCount,
		},
		{
			url: '/user/self/friends',
			name: 'Друзья',
			page: 'isUserSelfFriends',
			count: friendsCount,
		},
		{
			url: '/user/self/settings',
			name: 'Настройки',
			page: 'isUserSelfSettings',
		},
	];

	const mainTabs: Array<ITabs> = tabs.slice(0, 9);
	const secondaryTabs: Array<ITabs> = tabs.slice(9);

	return (
		<main className={block()}>
			<aside className={element('sidebar')}>
				<UserSelfProfile />
				<div className={element('sidebar-inner')}>
					<Tabs tabs={mainTabs} active={page} vertical />
					<Line className={element('sidebar-line')} />
					<Tabs tabs={secondaryTabs} active={page} vertical />
					<Line className={element('sidebar-line')} />
					<Button
						type="Link"
						href="/goals/create"
						theme="blue-light"
						size="medium"
						icon="plus"
						className={element('add-goal-btn')}
					>
						Добавить цель
					</Button>
				</div>
			</aside>
			{getUserContent()}
		</main>
	);
});
