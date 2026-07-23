import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {DailyRandomGoal} from '@/entities/goal/ui/DailyRandomGoal/DailyRandomGoal';
import GoalTimers from '@/entities/goal/ui/GoalTimers/GoalTimers';
import {WeeklySchedule} from '@/entities/regular-goal/ui/WeeklySchedule/WeeklySchedule';
import {getStatistics} from '@/entities/user/api/getUserStatistics';
import {IUserStatistics} from '@/entities/user/model/types';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import {ActivityHeatmap} from '@/widgets/activity-heatmap/ActivityHeatmap';
import {Info100Goals} from '@/widgets/info-100-goals/Info100Goals';
import {UserSelfDashboardSkeleton} from '@/widgets/user-self-dashboard/UserSelfDashboardSkeleton';
import {UserStatistics} from '@/widgets/user-statistics/UserStatistics';
import '@/widgets/user-self-dashboard/user-self-dashboard.scss';

export const UserSelfDashboard: FC = observer(() => {
	const [block, element] = useBem('user-self-dashboard');

	const [userStatistics, setUserStatistics] = useState<IUserStatistics | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		(async () => {
			setIsLoading(true);
			const res = await getStatistics();
			if (res.success) {
				setUserStatistics(res.data);
			}
			setIsLoading(false);
		})();
	}, []);

	if (isLoading && !userStatistics) {
		return <UserSelfDashboardSkeleton />;
	}

	return (
		<section className={block()}>
			<div className={element('info-wrapper')}>
				<div className={element('info-group')}>
					<Link to="/list/100-goals" className={element('info')}>
						<h3 className={element('info-title')}>Невыполненных целей в &quot;100 целей&quot;</h3>
						<span className={element('info-count')}>
							<Svg icon="star" />
							{userStatistics &&
								userStatistics.hundredGoals.easy.total +
									userStatistics.hundredGoals.medium.total +
									userStatistics.hundredGoals.hard.total -
									userStatistics.hundredGoals.easy.completed -
									userStatistics.hundredGoals.medium.completed -
									userStatistics.hundredGoals.hard.completed}
						</span>
					</Link>
					<Link to="/leaders" className={element('info')}>
						<h3 className={element('info-title')}>Место в рейтинге недели</h3>
						<span className={element('info-count')}>
							<Svg icon="award" />
							{userStatistics?.currentStats.weeklyRank}
						</span>
					</Link>
					<Link to="/user/self/active-goals" className={element('info')}>
						<h3 className={element('info-title')}>Активные цели и списки</h3>
						<p className={element('info-count-wrapper')}>
							<span className={element('info-count')}>
								<Svg icon="rocket" />
								{userStatistics?.currentStats.activeGoals}
							</span>
							<span className={element('info-count')}>
								<Svg icon="apps" />
								{userStatistics?.currentStats.activeLists}
							</span>
						</p>
					</Link>
				</div>
				{userStatistics && (
					<Info100Goals
						totalAddedEasy={userStatistics.hundredGoals.easy.total}
						totalAddedHard={userStatistics.hundredGoals.hard.total}
						totalAddedMedium={userStatistics.hundredGoals.medium.total}
						totalCompletedEasy={userStatistics.hundredGoals.easy.completed}
						totalCompletedHard={userStatistics.hundredGoals.hard.completed}
						totalCompletedMedium={userStatistics.hundredGoals.medium.completed}
						column
						className={element('info-100-goals')}
					/>
				)}

				{userStatistics?.weeklyProgress && <WeeklySchedule weeks={userStatistics?.weeklyProgress} className={element('weekly')} />}
				{userStatistics && <UserStatistics statistics={userStatistics} className={element('user-statistics')} />}
			</div>
			<DailyRandomGoal />
			<ActivityHeatmap />
			<GoalTimers />
			{/* <div className={element('title-wrapper')}>
				<Title className={element('title')} tag="h2">
					Можно выполнить сегодня
				</Title>
				<Button size="small" theme="blue-light" onClick={() => {}}>
					Показать другие
				</Button>
			</div> */}
			{/* {goals.map((goal) => {
				<Card goal={goal} />;
			})} */}
		</section>
	);
});
