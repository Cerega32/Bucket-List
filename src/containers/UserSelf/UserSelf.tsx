import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {Button} from '@/components/Button/Button';
import {Line} from '@/components/Line/Line';
import {ITabs, Tabs} from '@/components/Tabs/Tabs';
import {useBem} from '@/hooks/useBem';
import UserMapPage from '@/pages/UserMapPage/UserMapPage';
import {FriendsStore} from '@/store/FriendsStore';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';

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

import './user-self.scss';

export const UserSelf: FC<IPage> = observer(({page, subPage}) => {
	const [block, element] = useBem('user-self');

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

	// Используем счетчики из userSelf.counts, если они есть, иначе fallback на FriendsStore
	const {counts} = userSelf;
	const progressGoalsCount = counts?.progressGoals ?? 0;
	const regularGoalsCount = counts?.regularGoals ?? 0;
	const foldersCount = counts?.folders ?? 0;
	const friendsCount = counts?.friends ?? FriendsStore.friendsCount;
	const goalsWithMapCount = counts?.goalsWithMap ?? 0;

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
			count: goalsWithMapCount,
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
