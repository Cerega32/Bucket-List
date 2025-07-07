import React, {FC, useEffect, useMemo, useState} from 'react';

import {Loader} from '@/components/Loader/Loader';
import {Svg} from '@/components/Svg/Svg';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {getGoalActivity} from '@/utils/api/get/getGoalActivity';
import {pluralize} from '@/utils/text/pluralize';
import './activity-heatmap.scss';

interface ICompletedItem {
	id: number;
	title: string;
	completedAt: string;
}

interface IActivityItem {
	id: number;
	title: string;
	type: 'goal_completion' | 'list_completion' | 'goal_progress' | 'daily_goal' | 'regular_goal';
	completedAt?: string;
	createdAt?: string;
	percentageChange?: number;
	notes?: string;
	workDone?: boolean;
	currentStreak?: number;
	maxStreak?: number;
}

interface IActivityDay {
	date: string;
	goalCount: number;
	listCount: number;
	progressCount: number;
	dailyCount: number;
	regularCount: number;
	totalCount: number;
	activityType: 'none' | 'goal' | 'list' | 'progress' | 'daily' | 'regular' | 'mixed';
	activityTypes: string[];
	level: number;
	weekday: number;
	month: number;
	day: number;
	activities?: IActivityItem[];
	completedGoals?: ICompletedItem[];
	completedLists?: ICompletedItem[];
}

interface IActivityMonth {
	name: string;
	month: number;
	year: number;
}

interface IActivityStats {
	totalGoalsCompleted: number;
	totalListsCompleted: number;
	totalProgressUpdates: number;
	totalDailyCompleted: number;
	totalRegularCompleted: number;
	totalCompleted: number;
	activeDays: number;
	totalDays: number;
	currentStreak: number;
	maxStreak: number;
	activityPercentage: number;
	isActiveToday: boolean;
}

interface ActivityHeatmapProps {
	className?: string;
	period?: 'year' | 'halfyear' | 'quarter' | 'month';
}

// Определим интерфейс для позиций месяцев
interface IMonthPosition {
	month: IActivityMonth;
	startWeek: number;
	weekSpan: number;
	width: number;
}

// Добавляем интерфейс для данных недели
interface IWeekData {
	id: string;
	days: (IActivityDay | null)[];
}

// Типы для статуса загрузки
type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

const ActivityHeatmapComponent: FC<ActivityHeatmapProps> = ({className, period = 'year'}) => {
	const [block, element] = useBem('activity-heatmap', className);

	const [activityData, setActivityData] = useState<{
		dates: IActivityDay[];
		months: IActivityMonth[];
		stats: IActivityStats;
	} | null>(null);

	const [fetchStatus, setFetchStatus] = useState<FetchStatus>('loading');
	const [selectedDay, setSelectedDay] = useState<IActivityDay | null>(null);

	// Получение данных активности
	useEffect(() => {
		const fetchActivityData = async () => {
			setFetchStatus('loading');

			try {
				const response = await getGoalActivity(period);

				if (response.success && response.data) {
					// Преобразуем snake_case в camelCase для совместимости с интерфейсами
					if (response.data.stats && response.data.stats.is_active_today !== undefined) {
						response.data.stats.isActiveToday = response.data.stats.is_active_today;
					}
					setActivityData(response.data);
					setFetchStatus('success');
				} else {
					setFetchStatus('error');
				}
			} catch (err) {
				setFetchStatus('error');
			}
		};

		fetchActivityData();
	}, [period]);

	// Преобразуем линейный массив дат в матрицу для отображения сетки
	const prepareGridData = (): IWeekData[] => {
		if (!activityData || !activityData.dates.length) return [];

		const firstDate = new Date(activityData.dates[0].date);
		// Преобразуем 0-6 (вс-сб) в 0-6 (пн-вс)
		const firstDayWeekday = firstDate.getDay() === 0 ? 6 : firstDate.getDay() - 1;

		// Группируем даты по неделям
		const datesByWeek: Record<string, (IActivityDay | null)[]> = {};
		let currentWeek = 0;
		let dayInWeek = firstDayWeekday;

		// Сортируем даты
		const sortedDates = [...activityData.dates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		// Добавляем пустые ячейки для первой недели
		const firstWeekDays: (IActivityDay | null)[] = Array(7).fill(null);

		// Распределяем даты по неделям
		sortedDates.forEach((day) => {
			if (dayInWeek === 7) {
				dayInWeek = 0;
				currentWeek += 1;
			}

			const weekId = `week-${currentWeek}`;
			if (!datesByWeek[weekId]) {
				datesByWeek[weekId] = Array(7).fill(null);
			}

			if (currentWeek === 0) {
				firstWeekDays[dayInWeek] = day;
			} else {
				datesByWeek[weekId][dayInWeek] = day;
			}

			dayInWeek += 1;
		});

		// Добавляем первую неделю
		if (currentWeek === 0 || Object.keys(datesByWeek).length > 0) {
			datesByWeek['week-0'] = firstWeekDays;
		}

		// Преобразуем в массив недель
		const weeks: IWeekData[] = Object.entries(datesByWeek)
			.sort(([a], [b]) => parseInt(a.split('-')[1], 10) - parseInt(b.split('-')[1], 10))
			.map(([weekId, days]) => ({
				id: weekId,
				days,
			}));

		return weeks;
	};

	// Использование useMemo для кэширования результатов
	const gridData = useMemo(() => prepareGridData(), [activityData]);

	// Функция для создания описания активности
	const getActivityDescription = (day: IActivityDay) => {
		const activities = [];
		if (day.goalCount > 0) {
			activities.push(pluralize(day.goalCount, ['цель выполнена', 'цели выполнено', 'целей выполнено']));
		}
		if (day.listCount > 0) {
			activities.push(pluralize(day.listCount, ['список выполнен', 'списка выполнено', 'списков выполнено']));
		}
		if (day.progressCount > 0) {
			activities.push(pluralize(day.progressCount, ['прогресс обновлен', 'прогресса обновлено', 'прогрессов обновлено']));
		}
		if (day.dailyCount > 0) {
			activities.push(pluralize(day.dailyCount, ['ежедневная цель', 'ежедневные цели', 'ежедневных целей']));
		}
		if (day.regularCount > 0) {
			activities.push(pluralize(day.regularCount, ['регулярная цель', 'регулярные цели', 'регулярных целей']));
		}
		return activities.join(', ');
	};

	// Функция для обработки клика по ячейке
	const handleDayClick = (day: IActivityDay) => {
		setSelectedDay(day);
	};

	// Функция для форматирования даты
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});
	};

	// Названия дней недели
	const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

	// Рассчитываем количество недель и распределение месяцев
	const calculateMonthPositions = () => {
		if (!activityData || !activityData.dates.length) {
			return {monthPositions: [] as IMonthPosition[], totalWeeks: 0};
		}

		const {dates} = activityData;

		// Убедимся, что даты отсортированы
		const sortedDates = [...dates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		// Получаем недели, которые уже рассчитаны
		const weeks = prepareGridData();
		const totalWeeks = weeks.length;

		// Группируем даты по месяцам и определяем, к каким неделям они относятся
		const monthData: Record<
			string,
			{
				year: number;
				month: number;
				monthInfo: IActivityMonth;
				weeks: Set<string>;
			}
		> = {};

		sortedDates.forEach((day) => {
			const date = new Date(day.date);
			const year = date.getFullYear();
			const month = date.getMonth();
			const key = `${year}-${month}`;

			if (!monthData[key]) {
				const monthInfo = activityData.months.find((m) => m.month === month + 1 && m.year === year);

				if (monthInfo) {
					monthData[key] = {
						year,
						month: month + 1,
						monthInfo,
						weeks: new Set<string>(),
					};
				}
			}

			// Находим неделю, к которой относится текущий день
			const weekId = weeks.find((week) => week.days.some((d) => d && d.date === day.date))?.id;

			if (monthData[key] && weekId) {
				monthData[key].weeks.add(weekId);
			}
		});

		// Сортируем по времени
		const sortedMonths = Object.values(monthData).sort((a, b) => {
			if (a.year !== b.year) {
				return a.year - b.year;
			}
			return a.month - b.month;
		});

		// Расчет ширины месяцев пропорционально количеству недель
		const monthPositions: IMonthPosition[] = sortedMonths.map((data) => {
			const weekSpan = data.weeks.size;
			const width = (weekSpan / totalWeeks) * 100;

			// Находим индекс первой недели этого месяца
			const firstWeekId = [...data.weeks][0]; // Первый элемент множества
			const startWeekIndex = weeks.findIndex((w) => w.id === firstWeekId);

			return {
				month: data.monthInfo,
				startWeek: startWeekIndex !== -1 ? startWeekIndex : 0,
				weekSpan,
				width: Math.max(width, 5), // Минимальная ширина 5% для читаемости
			};
		});

		return {monthPositions, totalWeeks};
	};

	// Используем useMemo для кэширования вычислений
	const {monthPositions} = useMemo(
		() => (activityData ? calculateMonthPositions() : {monthPositions: [] as IMonthPosition[], totalWeeks: 0}),
		[activityData]
	);

	// Ширина недели в пикселях (соответствует CSS)
	const [weekWidth, setWeekWidth] = useState(window.innerWidth <= 768 ? 10 : 19);

	// Обновляем ширину недели при изменении размера окна
	useEffect(() => {
		const handleResize = () => {
			setWeekWidth(window.innerWidth <= 768 ? 10 : 19);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	// Функция рендеринга ячейки для дня
	const renderDayCell = (day: IActivityDay | null, dayIndex: number, weekId: string) => {
		if (!day) {
			return (
				<div
					key={`empty-cell-${weekId}-${dayIndex}`}
					className={element('day', {empty: true})}
					data-testid={`empty-day-${weekId}-${dayIndex}`}
				/>
			);
		}

		const dayDescription = `${formatDate(day.date)}: ${getActivityDescription(day)}`;

		return (
			<button
				key={`day-${day.date}`}
				className={element('day', {
					level: `${day.level}`,
					type: day.activityType,
				})}
				onClick={() => handleDayClick(day)}
				title={dayDescription}
				aria-label={dayDescription}
				type="button"
				data-testid={`day-${day.date}`}
			/>
		);
	};

	// Рендер всех активностей дня
	const renderActivities = (day: IActivityDay) => {
		if (!day.activities || day.activities.length === 0) {
			return <p>Нет активности в этот день</p>;
		}

		const activitiesByType = day.activities.reduce((acc, activity) => {
			if (!acc[activity.type]) {
				acc[activity.type] = [];
			}
			acc[activity.type].push(activity);
			return acc;
		}, {} as Record<string, IActivityItem[]>);

		return (
			<div className={element('activities-content')}>
				{activitiesByType['goal_completion'] && (
					<div className={element('activity-section')}>
						<div className={element('activity-header')}>
							<Svg icon="star" width="16px" height="16px" className={element('activity-icon')} />
							<span>
								{pluralize(activitiesByType['goal_completion'].length, [
									'цель выполнена',
									'цели выполнено',
									'целей выполнено',
								])}
							</span>
						</div>
						<ul className={element('activity-list')}>
							{activitiesByType['goal_completion'].map((activity) => (
								<li key={`goal-${activity.id}`} className={element('activity-item')}>
									{activity.title}
								</li>
							))}
						</ul>
					</div>
				)}

				{activitiesByType['list_completion'] && (
					<div className={element('activity-section')}>
						<div className={element('activity-header')}>
							<Svg icon="apps" width="16px" height="16px" className={element('activity-icon')} />
							<span>
								{pluralize(activitiesByType['list_completion'].length, [
									'список выполнен',
									'списка выполнено',
									'списков выполнено',
								])}
							</span>
						</div>
						<ul className={element('activity-list')}>
							{activitiesByType['list_completion'].map((activity) => (
								<li key={`list-${activity.id}`} className={element('activity-item')}>
									{activity.title}
								</li>
							))}
						</ul>
					</div>
				)}

				{activitiesByType['goal_progress'] && (
					<div className={element('activity-section')}>
						<div className={element('activity-header')}>
							<Svg icon="level" width="16px" height="16px" className={element('activity-icon')} />
							<span>
								{pluralize(activitiesByType['goal_progress'].length, [
									'прогресс обновлен',
									'прогресса обновлено',
									'прогрессов обновлено',
								])}
							</span>
						</div>
						<ul className={element('activity-list')}>
							{activitiesByType['goal_progress'].map((activity) => (
								<li key={`progress-${activity.id}`} className={element('activity-item')}>
									<div className={element('progress-info')}>
										<span className={element('progress-title')}>{activity.title}</span>
										{activity.percentageChange && (
											<span className={element('progress-change', {positive: activity.percentageChange > 0})}>
												{activity.percentageChange > 0 ? '+' : ''}
												{activity.percentageChange}%
											</span>
										)}
									</div>
									{activity.notes && <div className={element('progress-notes')}>{activity.notes}</div>}
								</li>
							))}
						</ul>
					</div>
				)}

				{activitiesByType['daily_goal'] && (
					<div className={element('activity-section')}>
						<div className={element('activity-header')}>
							<Svg icon="calender" width="16px" height="16px" className={element('activity-icon')} />
							<span>
								{pluralize(activitiesByType['daily_goal'].length, [
									'ежедневная цель',
									'ежедневные цели',
									'ежедневных целей',
								])}
							</span>
						</div>
						<ul className={element('activity-list')}>
							{activitiesByType['daily_goal'].map((activity) => (
								<li key={`daily-${activity.id}`} className={element('activity-item')}>
									<div className={element('daily-info')}>
										<span className={element('daily-title')}>{activity.title}</span>
									</div>
									{activity.notes && <div className={element('daily-notes')}>{activity.notes}</div>}
								</li>
							))}
						</ul>
					</div>
				)}

				{activitiesByType['regular_goal'] && (
					<div className={element('activity-section')}>
						<div className={element('activity-header')}>
							<Svg icon="watch" width="16px" height="16px" className={element('activity-icon')} />
							<span>
								{pluralize(activitiesByType['regular_goal'].length, [
									'регулярная цель',
									'регулярные цели',
									'регулярных целей',
								])}
							</span>
						</div>
						<ul className={element('activity-list')}>
							{activitiesByType['regular_goal'].map((activity) => (
								<li key={`regular-${activity.id}`} className={element('activity-item')}>
									<div className={element('regular-info')}>
										<span className={element('regular-title')}>{activity.title}</span>
										{activity.currentStreak && (
											<span className={element('regular-streak')}>Серия: {activity.currentStreak}</span>
										)}
									</div>
									{activity.notes && <div className={element('regular-notes')}>{activity.notes}</div>}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className={block()}>
			<Title className={element('title')} tag="h2">
				Активность выполнения целей и списков
			</Title>

			<Loader isLoading={fetchStatus === 'loading'}>
				{fetchStatus === 'error' ? (
					<div className={element('error')}>
						<p>Не удалось загрузить данные активности</p>
					</div>
				) : activityData ? (
					<>
						<div className={element('stats')}>
							<div className={element('stat-item')}>
								<span className={element('stat-value')}>{activityData.stats.totalGoalsCompleted}</span>
								<span className={element('stat-label')}>
									{pluralize(
										activityData.stats.totalGoalsCompleted,
										['цель выполнена', 'цели выполнено', 'целей выполнено'],
										false
									)}
								</span>
							</div>
							<div className={element('stat-item')}>
								<span className={element('stat-value')}>{activityData.stats.totalListsCompleted}</span>
								<span className={element('stat-label')}>
									{pluralize(
										activityData.stats.totalListsCompleted,
										['список выполнен', 'списка выполнено', 'списков выполнено'],
										false
									)}
								</span>
							</div>
							<div className={element('stat-item')}>
								<span className={element('stat-value')}>{activityData.stats.totalProgressUpdates}</span>
								<span className={element('stat-label')}>
									{pluralize(
										activityData.stats.totalProgressUpdates,
										['прогресс обновлен', 'прогресса обновлено', 'прогрессов обновлено'],
										false
									)}
								</span>
							</div>
							<div className={element('stat-item')}>
								<span className={element('stat-value')}>{activityData.stats.totalDailyCompleted}</span>
								<span className={element('stat-label')}>
									{pluralize(
										activityData.stats.totalDailyCompleted,
										['ежедневная цель', 'ежедневных цели', 'ежедневных целей'],
										false
									)}
								</span>
							</div>
							<div className={element('stat-item')}>
								<span className={element('stat-value')}>{activityData.stats.totalRegularCompleted}</span>
								<span className={element('stat-label')}>
									{pluralize(
										activityData.stats.totalRegularCompleted,
										['регулярная цель', 'регулярных цели', 'регулярных целей'],
										false
									)}
								</span>
							</div>
							<div className={element('stat-item')}>
								<span className={element('stat-value')}>{activityData.stats.currentStreak}</span>
								<span className={element('stat-label')}>текущая серия</span>
							</div>
							<div className={element('stat-item')}>
								<span className={element('stat-value')}>{activityData.stats.maxStreak}</span>
								<span className={element('stat-label')}>макс. серия</span>
							</div>
							<div className={element('stat-item')}>
								<span className={element('stat-value')}>{activityData.stats.activityPercentage}%</span>
								<span className={element('stat-label')}>активность</span>
							</div>
							<div className={element('stat-item')}>
								<span
									className={element('stat-value', {
										active: activityData.stats.isActiveToday,
										inactive: !activityData.stats.isActiveToday,
									})}
								>
									{activityData.stats.isActiveToday ? 'Да' : 'Нет'}
								</span>
								<span className={element('stat-label')}>сегодня</span>
							</div>
						</div>

						<div className={element('container')}>
							<div className={element('months')}>
								{monthPositions.map(
									(mp) =>
										mp.month && (
											<div
												key={`month-${mp.month.year}-${mp.month.month}`}
												className={element('month-label')}
												style={{
													left: `${mp.startWeek * weekWidth}px`,
													width: `${mp.weekSpan * weekWidth}px`,
												}}
											>
												{mp.month.name}
											</div>
										)
								)}
							</div>

							<div className={element('grid')}>
								{/* Метки дней недели */}
								<div className={element('weekdays')}>
									{weekdayLabels.map((day) => (
										<div key={`weekday-${day}`} className={element('weekday-label')}>
											{day}
										</div>
									))}
								</div>

								{/* Сетка активности */}
								<div className={element('cells')}>
									{gridData.map((weekData) => (
										<div key={weekData.id} className={element('week')} data-testid={`week-${weekData.id}`}>
											{weekData.days.map((day, dayIndex) => renderDayCell(day, dayIndex, weekData.id))}
										</div>
									))}
								</div>
							</div>

							<div className={element('legend')}>
								<div className={element('legend-section')}>
									<div className={element('legend-label')}>Интенсивность:</div>
									<div className={element('legend-scale')}>
										<div className={element('legend-cell', {level: '0'})} />
										<div className={element('legend-cell', {level: '1'})} />
										<div className={element('legend-cell', {level: '2'})} />
										<div className={element('legend-cell', {level: '3'})} />
										<div className={element('legend-cell', {level: '4'})} />
									</div>
									<div className={element('legend-label')}>больше</div>
								</div>

								<div className={element('legend-section')}>
									<div className={element('legend-label')}>Тип активности:</div>
									<div className={element('legend-types')}>
										<div className={element('legend-type')}>
											<div className={element('legend-cell', {type: 'goal'})} />
											<span className={element('legend-type-label')}>Цели</span>
										</div>
										<div className={element('legend-type')}>
											<div className={element('legend-cell', {type: 'progress'})} />
											<span className={element('legend-type-label')}>Прогресс</span>
										</div>
										<div className={element('legend-type')}>
											<div className={element('legend-cell', {type: 'daily'})} />
											<span className={element('legend-type-label')}>Ежедневные</span>
										</div>
										<div className={element('legend-type')}>
											<div className={element('legend-cell', {type: 'regular'})} />
											<span className={element('legend-type-label')}>Регулярные</span>
										</div>
										<div className={element('legend-type')}>
											<div className={element('legend-cell', {type: 'mixed'})} />
											<span className={element('legend-type-label')}>Смешанная</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						{selectedDay && (
							<div className={element('day-details')}>
								<h3>{formatDate(selectedDay.date)}</h3>
								{selectedDay.totalCount === 0 ? <p>Нет активности в этот день</p> : renderActivities(selectedDay)}
							</div>
						)}
					</>
				) : null}
			</Loader>
		</div>
	);
};

// Оборачиваем компонент в React.memo для предотвращения лишних рендеров
export const ActivityHeatmap = React.memo(ActivityHeatmapComponent);
