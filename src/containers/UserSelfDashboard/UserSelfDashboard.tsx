import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {ActivityHeatmap} from '@/components/ActivityHeatmap/ActivityHeatmap';
import GoalTimers from '@/components/GoalTimers/GoalTimers';
import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {Svg} from '@/components/Svg/Svg';
import {UserStatistics} from '@/components/UserStatistics/UserStatistics';
import {WeeklySchedule} from '@/components/WeeklySchedule/WeeklySchedule';
import {useBem} from '@/hooks/useBem';
import {IUserStatistics} from '@/typings/user';
import {getStatistics} from '@/utils/api/get/getUserStatistics';
import './user-self-dashboard.scss';

export const UserSelfDashboard: FC = observer(() => {
	const [block, element] = useBem('user-self-dashboard');

	const [userStatistics, setUserStatistics] = useState<IUserStatistics | null>(null);

	useEffect(() => {
		(async () => {
			const res = await getStatistics();
			if (res.success) {
				setUserStatistics(res.data);
			}
		})();
	}, []);

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
				{userStatistics && <UserStatistics statistics={userStatistics} />}
			</div>
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
