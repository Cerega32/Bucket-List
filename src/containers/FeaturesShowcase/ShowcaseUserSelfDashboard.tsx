import {FC} from 'react';

import {Info100Goals} from '@/components/Info100Goals/Info100Goals';
import {Svg} from '@/components/Svg/Svg';
import {UserStatistics} from '@/components/UserStatistics/UserStatistics';
import {WeeklySchedule} from '@/components/WeeklySchedule/WeeklySchedule';
import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {IUserStatistics} from '@/typings/user';

import {DEMO_USER_STATISTICS} from './features-showcase-data';

import '@/containers/UserSelfDashboard/user-self-dashboard.scss';

const getPendingHundredGoals = (statistics: IUserStatistics) => {
	const {hundredGoals} = statistics;
	return (
		hundredGoals.easy.total +
		hundredGoals.medium.total +
		hundredGoals.hard.total -
		hundredGoals.easy.completed -
		hundredGoals.medium.completed -
		hundredGoals.hard.completed
	);
};

interface ShowcaseUserSelfDashboardProps {
	className?: string;
}

export const ShowcaseUserSelfDashboard: FC<ShowcaseUserSelfDashboardProps> = (props) => {
	const {className} = props;
	const [block, element] = useBem('user-self-dashboard', className);
	const {isScreenXs} = useScreenSize();
	const statistics = DEMO_USER_STATISTICS;
	const pendingHundred = getPendingHundredGoals(statistics);
	const weeklyWeeks = isScreenXs ? statistics.weeklyProgress.slice(-4) : statistics.weeklyProgress;

	return (
		<section className={block()}>
			<div className={element('info-wrapper')}>
				<div className={element('info-group')}>
					<div className={element('info')}>
						<h3 className={element('info-title')}>Невыполненных целей в &quot;100 целей&quot;</h3>
						<span className={element('info-count')}>
							<Svg icon="star" />
							{pendingHundred}
						</span>
					</div>
					<div className={element('info')}>
						<h3 className={element('info-title')}>Место в рейтинге недели</h3>
						<span className={element('info-count')}>
							<Svg icon="award" />
							{statistics.currentStats.weeklyRank}
						</span>
					</div>
					<div className={element('info')}>
						<h3 className={element('info-title')}>Активные цели и списки</h3>
						<p className={element('info-count-wrapper')}>
							<span className={element('info-count')}>
								<Svg icon="rocket" />
								{statistics.currentStats.activeGoals}
							</span>
							<span className={element('info-count')}>
								<Svg icon="apps" />
								{statistics.currentStats.activeLists}
							</span>
						</p>
					</div>
				</div>
				<Info100Goals
					totalAddedEasy={statistics.hundredGoals.easy.total}
					totalAddedHard={statistics.hundredGoals.hard.total}
					totalAddedMedium={statistics.hundredGoals.medium.total}
					totalCompletedEasy={statistics.hundredGoals.easy.completed}
					totalCompletedHard={statistics.hundredGoals.hard.completed}
					totalCompletedMedium={statistics.hundredGoals.medium.completed}
					column
					className={element('info-100-goals')}
				/>
				<WeeklySchedule weeks={weeklyWeeks} className={element('weekly')} />
				<UserStatistics statistics={statistics} className={element('user-statistics')} />
			</div>
		</section>
	);
};
