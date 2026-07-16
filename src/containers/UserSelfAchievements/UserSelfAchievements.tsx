import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo, useState} from 'react';

import {Achievement} from '@/components/Achievement/Achievement';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {AchievementCategory, IAchievement} from '@/typings/achievements';
import {loadSelfAchievements} from '@/utils/loadSelfAchievements';

import {UserSelfAchievementsSkeleton} from './UserSelfAchievementsSkeleton';
import './user-self-achievements.scss';

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
	const [isLoading, setIsLoading] = useState(true);
	const {selfAchievements, selfAchievementsStale} = UserStore;

	useEffect(() => {
		let cancelled = false;

		(async () => {
			setIsLoading(true);
			await loadSelfAchievements({force: true});
			if (!cancelled) {
				setIsLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!selfAchievementsStale) {
			return undefined;
		}

		let cancelled = false;

		(async () => {
			await loadSelfAchievements({force: true});
			if (!cancelled) {
				setIsLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [selfAchievementsStale]);

	const groupedAchievements = useMemo(() => {
		const groups: Record<AchievementCategory, IAchievement[]> = {
			first_steps: [],
			progress: [],
			activity: [],
			achievements: [],
			premium: [],
			other: [],
		};

		selfAchievements.forEach((achievement) => {
			const category = achievement.category || 'other';
			if (groups[category]) {
				groups[category].push(achievement);
			} else {
				groups.other.push(achievement);
			}
		});

		Object.keys(groups).forEach((category) => {
			const categoryKey = category as AchievementCategory;
			groups[categoryKey].sort((a, b) => {
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
	}, [selfAchievements]);

	if (isLoading) {
		return <UserSelfAchievementsSkeleton />;
	}

	return (
		<div className={block({empty: selfAchievements.length === 0})}>
			{selfAchievements.length === 0 ? (
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
								<Title tag="h2" className={element('group-title')}>
									{CATEGORY_NAMES[category]}
								</Title>
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
		</div>
	);
});
