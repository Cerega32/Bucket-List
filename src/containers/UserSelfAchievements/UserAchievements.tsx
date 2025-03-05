import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {useBem} from '@/hooks/useBem';
import {IAchievement} from '@/typings/achievements';
import {GET} from '@/utils/fetch/requests';
import './user-achievements.scss';

// interface UserSelfAchievementsProps {
// }

export const UserSelfAchievements: FC = observer(() => {
	const [block, element] = useBem('user-self-achievements');

	const [achievements, setAchievements] = useState<Array<IAchievement>>([]);

	useEffect(() => {
		(async () => {
			const res = await GET('achievements', {auth: true});
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
