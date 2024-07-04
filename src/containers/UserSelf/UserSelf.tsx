import {observer} from 'mobx-react';
import {FC, useEffect, useMemo} from 'react';

import {useParams} from 'react-router-dom';

import {User100Goals} from '../User100Goals/User100Goals';
import {UserAchievements} from '../UserAchievements/UserAchievements';
import {UserActiveGoals, UserGoals} from '../UserGoals/UserGoals';

import {UserSelfAchievements} from '../UserSelfAchievements/UserAchievements';
import {UserSelfDashboard} from '../UserSelfDashboard/UserSelfDashboard';
import {UserSelfGoals} from '../UserSelfGoals/UserSelfGoals';
import UserSelfSettings from '../UserSelfSettings/UserSelfSettings';
import {UserShowcase} from '../UserShowcase/UserShowcase';

import {ITabs, Tabs} from '@/components/Tabs/Tabs';
import {UserInfo} from '@/components/UserInfo/UserInfo';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import './user-self.scss';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';
import {getUser} from '@/utils/api/get/getUser';

export const UserSelf: FC<IPage> = observer(({page, subPage}) => {
	const [block, element] = useBem('user-self');

	const {userInfo} = UserStore;

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
