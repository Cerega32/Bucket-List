import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

import {Loader} from '@/components/Loader/Loader';
import {UserInfo} from '@/components/UserInfo/UserInfo';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';
import {getUser} from '@/utils/api/get/getUser';
import './user.scss';

import {User100Goals} from '../User100Goals/User100Goals';
import {UserAchievements} from '../UserAchievements/UserAchievements';
import {UserGoals} from '../UserGoals/UserGoals';
import {UserShowcase} from '../UserShowcase/UserShowcase';

export const User: FC<IPage> = observer(({page, subPage}) => {
	const [block] = useBem('user');

	const {userInfo} = UserStore;
	const {id} = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [hasVisited, setHasVisited] = useState(false);

	if (!id) {
		return null;
	}

	useEffect(() => {
		(async () => {
			setIsLoading(true);
			await getUser(id);

			// Обновляем прогресс заданий при посещении профиля (только один раз за сессию)
			if (!hasVisited) {
				// Прогресс заданий обновляется автоматически на бэкенде
				setHasVisited(true);
			}

			setIsLoading(false);
		})();
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

	return (
		<main className={block()}>
			<Loader isLoading={isLoading}>
				<UserInfo
					avatar={userInfo.avatar || null}
					name={userInfo.name}
					totalAdded={userInfo.totalAddedGoals}
					totalCompleted={userInfo.totalCompletedGoals}
					page={page}
					id={id}
					totalAddedLists={userInfo.totalAddedLists}
					totalCompletedLists={userInfo.totalCompletedLists}
					totalAchievements={userInfo.totalAchievements}
					background={userInfo.coverImage}
				/>
			</Loader>
			{getUserContent()}
		</main>
	);
});
