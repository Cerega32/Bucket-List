import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IUserStatistics} from '@/typings/user';

import {Line} from '../Line/Line';
import {Progress} from '../Progress/Progress';
import {Svg} from '../Svg/Svg';
import './user-statistics.scss';

interface UserStatisticsProps {
	className?: string;
	statistics: IUserStatistics;
}

export const UserStatistics: FC<UserStatisticsProps> = (props) => {
	const {className, statistics} = props;

	const [block, element] = useBem('user-statistics', className);

	return (
		<section className={block()}>
			<div className={element('level')}>
				<p className={element('level-text')}>Текущий уровень</p>
				<p className={element('level-number')}>
					<Svg icon="level" />
					{statistics.currentStats.level}
				</p>
				<Progress
					done={statistics.currentStats.currentExperience}
					all={statistics.currentStats.nextLevelExperience}
					text={`${statistics.currentStats.currentExperience}/${statistics.currentStats.nextLevelExperience}`}
				/>
			</div>
			<Line height={-16} margin="16px 0" />
			<p className={element('text')}>
				<span>Заработано очков</span>
				<span>{statistics.currentStats.currentExperience}</span>
			</p>
			<p className={element('text')}>
				<span>Следующий уровень через</span>
				<span>{statistics.currentStats.nextLevelExperience - statistics.currentStats.currentExperience}</span>
			</p>
			<p className={element('text')}>
				<span>Заработано за впечатления</span>
				<span>{statistics.totalStats.reviewsCount}</span>
			</p>
			<p className={element('text')}>
				<span>Выполнение целей</span>
				<span>{statistics.totalStats.completedGoals}</span>
			</p>
			<p className={element('text')}>
				<span>Достижения</span>
				<span>{statistics.totalStats.achievementsCount}</span>
			</p>
			{statistics.totalStats.weeklyCompletedChallenges !== undefined && (
				<p className={element('text')}>
					<span>Еженедельные задания</span>
					<span>
						{statistics.totalStats.weeklyCompletedChallenges}/{statistics.totalStats.totalWeeklyChallenges}
					</span>
				</p>
			)}
		</section>
	);
};
