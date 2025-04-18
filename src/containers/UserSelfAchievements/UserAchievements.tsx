import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {IAchievement} from '@/typings/achievements';
import {GET} from '@/utils/fetch/requests';
import './user-achievements.scss';

// interface UserSelfAchievementsProps {
// }

export const UserSelfAchievements: FC = observer(() => {
	const [block, element] = useBem('user-self-achievements');

	const [achievements, setAchievements] = useState<Array<IAchievement>>([]);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		(async () => {
			setIsLoading(true);
			const res = await GET('achievements', {auth: true});
			if (res.success) {
				setAchievements(res.data.data);
			}
			setIsLoading(false);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Loader isLoading={isLoading} className={block()}>
			{achievements.map((achievement) => (
				<Achievement key={achievement.id} className={element('achievement')} achievement={achievement} />
			))}
		</Loader>
	);
});
