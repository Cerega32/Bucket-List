import {FC, useEffect, useState} from 'react';

import {CategoryProgress} from '@/components/CategoryProgress/CategoryProgress';
import {DailyChallenges} from '@/components/DailyChallenges/DailyChallenges';
import {GoalStats} from '@/components/GoalStats/GoalStats';
import {HundredGoalsProgress} from '@/components/HundredGoalsProgress/HundredGoalsProgress';
import {Loader} from '@/components/Loader/Loader';
import {PopularGoals} from '@/components/PopularGoals/PopularGoals';
import {QuickNavigation} from '@/components/QuickNavigation/QuickNavigation';
import {Title} from '@/components/Title/Title';
import {UpcomingTimers} from '@/components/UpcomingTimers/UpcomingTimers';
import {WelcomeWidget} from '@/components/WelcomeWidget/WelcomeWidget';
import {useBem} from '@/hooks/useBem';
import {IDashboardData} from '@/typings/dashboard';
import {getDashboardData} from '@/utils/api/get/getDashboardData';
import {markGoal} from '@/utils/api/post/markGoal';

import './dashboard.scss';

export const Dashboard: FC = () => {
	const [block, element] = useBem('dashboard');
	const [data, setData] = useState<IDashboardData | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		(async () => {
			setIsLoading(true);
			try {
				const res = await getDashboardData();
				if (res.success) {
					setData(res.data);
				}
			} catch (error) {
				// Заменить console.error на logger.error или убрать совсем
				// console.error('Ошибка при загрузке данных дашборда:', error);
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	const handleMarkGoal = async (code: string, done: boolean): Promise<void> => {
		const res = await markGoal(code, !done);
		if (res.success) {
			// Прогресс заданий обновляется автоматически на бэкенде

			// Обновляем таймеры в state после отметки
			if (data && data.upcomingTimers) {
				const updatedTimers = data.upcomingTimers.map((timer) => {
					if (timer.goal.code === code) {
						return {
							...timer,
							goal: {
								...timer.goal,
								completedByUser: !done,
							},
						};
					}
					return timer;
				});

				setData({
					...data,
					upcomingTimers: updatedTimers,
				});
			}
		}
	};

	return (
		<main className={block()}>
			<Loader isLoading={isLoading}>
				{data && (
					<>
						<WelcomeWidget className={element('welcome')} quote={data.dailyQuote} stats={data.userStats} />

						<DailyChallenges className={element('challenges')} />

						{data.upcomingTimers && data.upcomingTimers.length > 0 && (
							<section className={element('timers')}>
								<Title className={element('section-title')} tag="h2">
									Ближайшие дедлайны
								</Title>
								<UpcomingTimers
									className={element('timers-list')}
									timers={data.upcomingTimers}
									onMarkComplete={handleMarkGoal}
								/>
							</section>
						)}

						<div className={element('progress-row')}>
							<CategoryProgress className={element('widget')} data={data.categoriesProgress} />
							<GoalStats className={element('widget')} stats={data.goalHealth} />
						</div>

						<QuickNavigation
							className={element('navigation')}
							goalsCount={data.goalsCount}
							listsCount={data.listsCount}
							categoriesCount={data.categoriesCount}
						/>

						{data.popularGoals && data.popularGoals.length > 0 && (
							<section className={element('popular')}>
								<Title className={element('section-title')} tag="h2">
									Популярные цели
								</Title>
								<PopularGoals goals={data.popularGoals} onMarkComplete={handleMarkGoal} />
							</section>
						)}

						{data.hundredGoalsList && (
							<HundredGoalsProgress className={element('hundred-goals')} progress={data.hundredGoalsList} />
						)}
					</>
				)}
			</Loader>
		</main>
	);
};
