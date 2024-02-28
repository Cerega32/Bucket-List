import {observer} from 'mobx-react';
import {FC, useEffect, useMemo} from 'react';

import {useParams} from 'react-router-dom';

import {User100Goals} from '../User100Goals/User100Goals';
import {UserAchievements} from '../UserAchievements/UserAchievements';
import {UserActiveGoals, UserGoals} from '../UserGoals/UserGoals';

import {UserSelfDashboard} from '../UserSelfDashboard/UserSelfDashboard';
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
	const [block, element] = useBem('user');

	const {setHeader} = ThemeStore;
	const {userInfo} = UserStore;

	useEffect(() => {
		setHeader('white');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getUserContent = () => {
		switch (page) {
			// case 'isUserShowcase':
			// 	return <UserShowcase id={id} />;
			// case 'isUser100Goals':
			// 	return <User100Goals id={id} />;
			// case 'isUserActiveGoals':
			// 	return <UserGoals id={id} subPage={subPage} />;
			// case 'isUserDoneGoals':
			// 	return <UserGoals id={id} subPage={subPage} completed />;
			// case 'isUserAchievements':
			// 	return <UserAchievements id={id} />;
			default:
				return <UserSelfDashboard />;
		}
	};

	const tabs: Array<ITabs> = useMemo(() => {
		return [
			{
				url: '/user/showcase',
				name: 'Витрина',
				page: 'isUserShowcase',
			},
			{
				url: '/user/100-goal',
				name: '100 целей',
				page: 'isUser100Goals',
			},
			{
				url: '/user/active-goals',
				name: 'Активные цели и списки',
				page: 'isUserActiveGoals',
			},
			{
				url: '/user/done-goals',
				name: 'Выполненные',
				page: 'isUserDoneGoals',
			},
			{
				url: '/user/achievements',
				name: 'Достижения',
				page: 'isUserAchievements',
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
