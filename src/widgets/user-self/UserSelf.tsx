import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {FriendsStore} from '@/entities/friend/model/FriendsStore';
import {isPremiumSubscriptionActive} from '@/entities/regular-goal/lib/checkRegularGoalsAddLimit';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {IPage} from '@/shared/types/page';
import {Button} from '@/shared/ui/Button/Button';
import {Line} from '@/shared/ui/Line/Line';
import {ITabs, Tabs} from '@/shared/ui/Tabs/Tabs';
import UserMapPage from '@/widgets/user-map/UserMapPage';
import {UserSelfProfile} from '@/widgets/user-self/UserSelfProfile';
import {UserSelfAchievements} from '@/widgets/user-self-achievements/UserSelfAchievements';
import {UserSelfDashboard} from '@/widgets/user-self-dashboard/UserSelfDashboard';
import {UserSelfFolders} from '@/widgets/user-self-folders/UserSelfFolders';
import {UserSelfFriends} from '@/widgets/user-self-friends/UserSelfFriends';
import {UserSelfGoals} from '@/widgets/user-self-goals/UserSelfGoals';
import {UserSelfProgress} from '@/widgets/user-self-progress/UserSelfProgress';
import {UserSelfRegular} from '@/widgets/user-self-regular/UserSelfRegular';
import {UserSelfSettings} from '@/widgets/user-self-settings/UserSelfSettings';
import {UserSelfSubscription} from '@/widgets/user-self-subscription/UserSelfSubscription';

import '@/widgets/user-self/user-self.scss';

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
			case 'isUserSelfPending':
				return <UserSelfGoals subPage={subPage as string} completed={false} pendingCatalogReview />;
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
	const isPremiumActive = isPremiumSubscriptionActive(userSelf);

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
			...(!isPremiumActive ? {premiumTag: true} : {}),
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
			url: '/user/self/pending-review',
			name: 'Модерация',
			page: 'isUserSelfPending',
		},
		...(isPremiumActive
			? []
			: [
					{
						url: '/user/self/subs',
						name: 'Больше функционала',
						page: 'isUserSelfSubs',
					},
			  ]),
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
						size="small"
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
