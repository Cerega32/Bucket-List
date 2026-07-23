import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';

import {getUserAchievements} from '@/entities/achievement/api/getUserAchievements';
import {IAchievement} from '@/entities/achievement/model/types';
import {Achievement} from '@/entities/achievement/ui/Achievement/Achievement';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';
import {UserAchievementsSkeleton} from '@/widgets/user-achievements/UserAchievementsSkeleton';
import '@/widgets/user-achievements/user-achievements.scss';

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
			const res = await getUserAchievements(id);
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
		return <UserAchievementsSkeleton />;
	}

	return (
		<div className={block({empty: achievements.length === 0})}>
			{achievements.length === 0 ? (
				<EmptyState title="У этого пользователя пока нет достижений" description="Выполняйте цели, чтобы получать достижения" />
			) : (
				achievements.map((achievement) => (
					<Achievement key={achievement.id} className={element('achievement')} achievement={achievement} />
				))
			)}
		</div>
	);
});
