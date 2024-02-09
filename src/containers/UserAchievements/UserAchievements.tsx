import {observer} from 'mobx-react';
import {FC, useEffect, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {useBem} from '@/hooks/useBem';
import {IAchievement} from '@/typings/achievements';
import './user-achievements.scss';
import {GET} from '@/utils/fetch/requests';

interface UserAchievementsProps {
	id: string;
}

export const UserAchievements: FC<UserAchievementsProps> = observer((props) => {
	const {id} = props;
	const [block, element] = useBem('user-achievements');

	const [achievements, setAchievements] = useState<Array<IAchievement>>([]);

	useEffect(() => {
		(async () => {
			const res = await GET('achievements', {get: {user_id: id}});
			if (res.success) {
				setAchievements(res.data.data);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<section className={block()}>
			{achievements.map((achievement) => (
				<Achievement key={achievement.id} className={element('achievement')} achievement={achievement} />
			))}
		</section>
	);
});
