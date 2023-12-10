import {observer} from 'mobx-react';
import {FC, useEffect} from 'react';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {UserInfo} from '@/components/UserInfo/UserInfo';
import './user.scss';
import {GET} from '@/utils/fetch/requests';
import {UserStore} from '@/store/UserStore';
import {getUser} from '@/utils/api/get/getUser';
import {IPage} from '@/typings/page';
import {UserActiveGoals} from '../UserActiveGoals/UserActiveGoals';

export const User: FC<IPage> = observer(({page}) => {
	const [block, element] = useBem('user');

	const {setHeader} = ThemeStore;
	const {userInfo} = UserStore;

	useEffect(() => {
		setHeader('white');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		(async () => {
			await getUser();
			const res = await GET('self/added-goals', {auth: true});
			console.log(res);
		})();
	}, []);

	const getUserContent = () => {
		switch (page) {
			case 'isUserActiveGoals':
				return <UserActiveGoals />;
			default:
				return null;
		}
	};

	return (
		<main className={block()}>
			<UserInfo
				avatar={userInfo.avatar}
				name={userInfo.name}
				totalAdded={userInfo.totalAddedGoals}
				totalCompleted={userInfo.totalCompletedGoals}
				page={page}
			/>
			{getUserContent()}
		</main>
	);
});
