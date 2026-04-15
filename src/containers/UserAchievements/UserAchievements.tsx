import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IAchievement} from '@/typings/achievements';
import {GET} from '@/utils/fetch/requests';
import './user-achievements.scss';

interface UserAchievementsProps {
	id: string;
}

export const UserAchievements: FC<UserAchievementsProps> = observer((props) => {
	const {id} = props;
	const [block, element] = useBem('user-achievements');

	const {achievements, setAchievements, achievementsLoadedForId, setAchievementsLoadedForId} = UserStore;

	useEffect(() => {
		if (achievementsLoadedForId === id) return undefined;
		let cancelled = false;
		setAchievementsLoadedForId(null);
		setAchievements([]);
		(async () => {
			const res = await GET('achievements', {get: {user_id: id}});
			if (cancelled) return;
			if (res.success) {
				// Фильтруем только выполненные достижения
				const achieved = res.data.data.filter((achievement: IAchievement) => achievement.isAchieved);
				setAchievements(achieved);
			}
			setAchievementsLoadedForId(id);
		})();
		return () => {
			cancelled = true;
		};
	}, [id]);

	const isFresh = achievementsLoadedForId === id;

	if (!isFresh) {
		return <Loader isLoading className={block({empty: true})} />;
	}

	return (
		<Loader isLoading={false} className={block({empty: achievements.length === 0})}>
			{achievements.length === 0 ? (
				<EmptyState title="У этого пользователя пока нет достижений" description="Выполняйте цели, чтобы получать достижения" />
			) : (
				achievements.map((achievement) => (
					<Achievement key={achievement.id} className={element('achievement')} achievement={achievement} />
				))
			)}
		</Loader>
	);
});
