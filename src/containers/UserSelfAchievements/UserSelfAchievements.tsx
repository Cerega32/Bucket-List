import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {AchievementCategory, IAchievement} from '@/typings/achievements';
import {GET} from '@/utils/fetch/requests';
import './user-self-achievements.scss';

// interface UserSelfAchievementsProps {
// }

const CATEGORY_NAMES: Record<AchievementCategory, string> = {
	first_steps: 'Первые шаги',
	progress: 'Прогресс',
	activity: 'Активность',
	achievements: 'Достигатор',
	premium: 'Premium',
	other: 'Прочее',
};

const CATEGORY_ORDER: AchievementCategory[] = ['first_steps', 'progress', 'activity', 'achievements', 'premium', 'other'];

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

	const groupedAchievements = useMemo(() => {
		const groups: Record<AchievementCategory, IAchievement[]> = {
			first_steps: [],
			progress: [],
			activity: [],
			achievements: [],
			premium: [],
			other: [],
		};

		achievements.forEach((achievement) => {
			const category = achievement.category || 'other';
			if (groups[category]) {
				groups[category].push(achievement);
			} else {
				groups.other.push(achievement);
			}
		});

		// Сортируем достижения внутри каждой группы
		Object.keys(groups).forEach((category) => {
			const categoryKey = category as AchievementCategory;
			groups[categoryKey].sort((a, b) => {
				// Секретные достижения всегда идут последними
				if (a.isSecret && !b.isSecret) {
					return 1;
				}
				if (!a.isSecret && b.isSecret) {
					return -1;
				}
				return a.id - b.id;
			});
		});

		return groups;
	}, [achievements]);

	return (
		<Loader isLoading={isLoading} className={block({empty: achievements.length === 0})}>
			{achievements.length === 0 ? (
				<EmptyState title="У вас пока нет достижений" description="Выполняйте цели и получайте достижения за свой прогресс" />
			) : (
				<div className={element('groups')}>
					{CATEGORY_ORDER.map((category) => {
						const categoryAchievements = groupedAchievements[category];
						if (categoryAchievements.length === 0) {
							return null;
						}

						return (
							<div key={category} className={element('group')}>
								<h3 className={element('group-title')}>{CATEGORY_NAMES[category]}</h3>
								<div className={element('group-content')}>
									{categoryAchievements.map((achievement) => (
										<Achievement key={achievement.id} className={element('achievement')} achievement={achievement} />
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</Loader>
	);
});
