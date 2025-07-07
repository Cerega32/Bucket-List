import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Loader} from '@/components/Loader/Loader';
import {RegularGoalCard} from '@/components/RegularGoalCard/RegularGoalCard';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {getRegularGoalStatistics, IRegularGoalStatistics, markRegularProgress} from '@/utils/api/goals';

import './user-self-regular.scss';

interface UserSelfRegularProps {
	className?: string;
}

export const UserSelfRegular: FC<UserSelfRegularProps> = observer(({className}) => {
	const [block, element] = useBem('user-self-regular', className);
	const [statisticsData, setStatisticsData] = useState<IRegularGoalStatistics[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadRegularGoalStatistics = async () => {
		setIsLoading(true);
		try {
			const response = await getRegularGoalStatistics();
			if (response.success && response.data) {
				setStatisticsData(response.data);
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось загрузить регулярные цели',
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadRegularGoalStatistics();
	}, []);

	const handleProgressUpdate = async (regularGoalId: number) => {
		try {
			const response = await markRegularProgress({
				regular_goal_id: regularGoalId,
				completed: true,
				notes: '',
			});

			if (response.success && response.data) {
				// Полностью перезагружаем данные вместо частичного обновления
				// чтобы избежать проблем с неполными объектами
				await loadRegularGoalStatistics();

				NotificationStore.addNotification({
					type: 'success',
					title: 'Успешно!',
					message: 'Прогресс отмечен',
				});
			}
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: 'Не удалось отметить прогресс',
			});
		}
	};

	const getActiveGoals = () => {
		return statisticsData.filter((stats) => stats && stats.isActive && !stats.isPaused);
	};

	const getTodayCompletedGoals = () => {
		return statisticsData.filter((stats) => stats && stats.currentPeriodProgress?.completedToday);
	};

	const getTodayPendingGoals = () => {
		return statisticsData.filter((stats) => stats && stats.canCompleteToday && !stats.currentPeriodProgress?.completedToday);
	};

	const getUpcomingGoals = () => {
		return statisticsData.filter((stats) => stats && stats.nextTargetDate && !stats.canCompleteToday);
	};

	// Конвертируем статистику в формат IGoal для совместимости с RegularGoalCard
	const convertStatsToGoal = (stats: IRegularGoalStatistics): any => {
		return {
			id: stats.regularGoalData.goal,
			title: stats.regularGoalData.goalTitle,
			description: '',
			shortDescription: '',
			category: {
				id: 0,
				name: stats.regularGoalData.goalCategory,
				nameEn: stats.regularGoalData.goalCategory,
				parentCategory: null,
			},
			complexity: 'medium' as const,
			image: stats.regularGoalData.goalImage,
			code: stats.regularGoalData.goalCode,
			estimatedTime: undefined,
			createdBy: {
				id: stats.user,
				username: stats.userUsername,
				avatar: undefined,
			},
			location: undefined,
			totalAdded: 0,
			totalCompleted: 0,
			addedByUser: true,
			completedByUser: false,
			createdAt: stats.regularGoalData.createdAt,
			addedFromList: [],
			timer: null,
			userVisitedLocation: false,

			progressPercentage: 0,
			isCompletedByUser: false,
			isDailyGoal: false,
			userFolders: [],
			regularConfig: {
				id: stats.regularGoal,
				frequency: stats.regularGoalData.frequency,
				weeklyFrequency: stats.regularGoalData.weeklyFrequency,
				customSchedule: stats.regularGoalData.customSchedule,
				durationType: stats.regularGoalData.durationType,
				durationValue: stats.regularGoalData.durationValue,
				endDate: stats.regularGoalData.endDate,
				allowSkipDays: stats.regularGoalData.allowSkipDays,
				resetOnSkip: stats.regularGoalData.resetOnSkip,
				isActive: stats.regularGoalData.isActive,
				createdAt: stats.regularGoalData.createdAt,
				statistics: stats,
			},
			createdByUser: true,
			isCanEdit: false,
			totalComments: 0,
			totalLists: 0,
			categoryRank: 1,
			totalAdditions: 0,
		};
	};

	const renderGoalsList = (statsArray: IRegularGoalStatistics[], title: string, emptyMessage: string) => {
		if (statsArray.length === 0) {
			return (
				<div className={element('empty-section')}>
					<h3 className={element('section-title')}>{title}</h3>
					<p className={element('empty-message')}>{emptyMessage}</p>
				</div>
			);
		}

		return (
			<div className={element('section')}>
				<h3 className={element('section-title')}>
					{title} <span className={element('count')}>({statsArray.length})</span>
				</h3>
				<div className={element('goals-grid')}>
					{statsArray.map((stats) => {
						const goal = convertStatsToGoal(stats);

						return (
							<RegularGoalCard
								key={stats.regularGoal}
								goal={goal}
								statistics={stats}
								onProgressUpdate={() => handleProgressUpdate(stats.regularGoal)}
							/>
						);
					})}
				</div>
			</div>
		);
	};

	const getOverallStats = () => {
		if (statisticsData.length === 0) return null;

		// Фильтруем только валидные объекты статистики
		const validStats = statisticsData.filter(
			(stat) =>
				stat &&
				typeof stat.totalCompletions === 'number' &&
				typeof stat.completionPercentage === 'number' &&
				typeof stat.currentStreak === 'number' &&
				typeof stat.maxStreak === 'number'
		);

		if (validStats.length === 0) return null;

		const totalCompletions = validStats.reduce((sum, stat) => sum + stat.totalCompletions, 0);
		const averageCompletion = validStats.reduce((sum, stat) => sum + stat.completionPercentage, 0) / validStats.length;
		const activeStreaks = validStats.filter((stat) => stat.currentStreak > 0).length;
		const maxStreak = Math.max(...validStats.map((stat) => stat.maxStreak));

		return {
			totalCompletions,
			averageCompletion,
			activeStreaks,
			maxStreak,
			totalGoals: validStats.length,
		};
	};

	const overallStats = getOverallStats();

	if (isLoading) {
		return <Loader isLoading />;
	}

	if (statisticsData.length === 0) {
		return (
			<div className={block()}>
				<Title tag="h1" className={element('title')}>
					Регулярные цели
				</Title>
				<div className={element('empty-state')}>
					<p>У вас пока нет регулярных целей.</p>
					<p>Создайте цель и настройте для неё регулярность выполнения!</p>
				</div>
			</div>
		);
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<Title tag="h1" className={element('title')}>
					Регулярные цели
				</Title>

				{overallStats && (
					<div className={element('overall-stats')}>
						<div className={element('stat-card')}>
							<span className={element('stat-value')}>{overallStats.totalGoals}</span>
							<span className={element('stat-label')}>Активных целей</span>
						</div>
						<div className={element('stat-card')}>
							<span className={element('stat-value')}>{overallStats.totalCompletions}</span>
							<span className={element('stat-label')}>Всего выполнений</span>
						</div>
						<div className={element('stat-card')}>
							<span className={element('stat-value')}>{Math.round(overallStats.averageCompletion)}%</span>
							<span className={element('stat-label')}>Средний прогресс</span>
						</div>
						<div className={element('stat-card')}>
							<span className={element('stat-value')}>{overallStats.maxStreak}</span>
							<span className={element('stat-label')}>Лучшая серия</span>
						</div>
					</div>
				)}
			</div>

			<div className={element('content')}>
				{renderGoalsList(getTodayPendingGoals(), 'Нужно выполнить сегодня', 'Все цели на сегодня выполнены!')}

				{renderGoalsList(getTodayCompletedGoals(), 'Выполнено сегодня', 'Пока ничего не выполнено сегодня')}

				{renderGoalsList(getUpcomingGoals(), 'Запланированные', 'Нет запланированных целей')}

				{renderGoalsList(getActiveGoals(), 'Все активные цели', 'Нет активных регулярных целей')}
			</div>
		</div>
	);
});
