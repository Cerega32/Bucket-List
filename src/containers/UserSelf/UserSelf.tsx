import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo} from 'react';

import {ITabs, Tabs} from '@/components/Tabs/Tabs';
import {useBem} from '@/hooks/useBem';
import {IPage} from '@/typings/page';
import {getUser} from '@/utils/api/get/getUser';

import {UserSelfAchievements} from '../UserSelfAchievements/UserAchievements';
import {UserSelfDashboard} from '../UserSelfDashboard/UserSelfDashboard';
import {UserSelfFolders} from '../UserSelfFolders/UserSelfFolders';
import {UserSelfFriends} from '../UserSelfFriends/UserSelfFriends';
import {UserSelfGoals} from '../UserSelfGoals/UserSelfGoals';
import {UserSelfProgress} from '../UserSelfProgress/UserSelfProgress';
import {UserSelfRegular} from '../UserSelfRegular/UserSelfRegular';
import {UserSelfSettings} from '../UserSelfSettings/UserSelfSettings';
import './user-self.scss';

export const UserSelf: FC<IPage> = observer(({page, subPage}) => {
	const [block, element] = useBem('user-self');

	useEffect(() => {
		(async () => {
			await getUser();
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
			case 'isUserSelfRegular':
				return <UserSelfRegular />;
			default:
				return <UserSelfDashboard />;
		}
	};

	const tabs: Array<ITabs> = useMemo(() => {
		return [
			{
				url: '/user/self',
				name: 'Дашборд',
				page: 'isUserSelf',
			},
			{
				url: '/user/self/achievements',
				name: 'Достижения',
				page: 'isUserSelfAchievements',
			},
			{
				url: '/user/self/friends',
				name: 'Друзья',
				page: 'isUserSelfFriends',
			},
			{
				url: '/user/self/folders',
				name: 'Папки целей',
				page: 'isUserSelfFolders',
			},
			{
				url: '/user/self/progress',
				name: 'Прогресс целей',
				page: 'isUserSelfProgress',
			},
			{
				url: '/user/self/regular',
				name: 'Регулярные цели',
				page: 'isUserSelfRegular',
			},
			{
				url: '/user/self/active-goals',
				name: 'Активные цели и списки',
				page: 'isUserSelfActive',
			},
			{
				url: '/user/self/done-goals',
				name: 'Выполненные',
				page: 'isUserSelfDone',
			},
			{
				url: '/user/self/settings',
				name: 'Настройки',
				page: 'isUserSelfSettings',
			},
		];
	}, []);

	return (
		<main className={block()}>
			<aside className={element('sidebar')}>
				<Tabs tabs={tabs} active={page} vertical />
			</aside>
			{getUserContent()}
		</main>
	);
});
