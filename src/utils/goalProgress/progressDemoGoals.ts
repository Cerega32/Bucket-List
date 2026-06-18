import {IGoalProgress} from '@/utils/api/goals';

const getCurrentDayIndex = (): number => {
	const day = new Date().getDay();
	return day === 0 ? 6 : day - 1;
};

const buildWeekWorkDone = (completedDays: number[]): boolean[] => {
	const week = [false, false, false, false, false, false, false];
	completedDays.forEach((dayIndex) => {
		if (dayIndex >= 0 && dayIndex <= 6) {
			week[dayIndex] = true;
		}
	});
	return week;
};

const todayIndex = getCurrentDayIndex();

export const DEMO_PROGRESS_GOALS: IGoalProgress[] = [
	{
		id: -1,
		goal: -1,
		goalTitle: 'Прочитать «Мастер и Маргарита»',
		goalCategory: 'Литературные миры',
		goalCategoryNameEn: 'books',
		goalImage: '/assets/main-img/m&m.jpg',
		goalCode: 'demo-read-master',
		progressPercentage: 50,
		dailyNotes: '',
		isWorkingToday: true,
		lastUpdated: '2026-05-28',
		createdAt: '2026-05-18',
		recentEntries: [],
		workedDaysCount: 12,
		maxConsecutiveWorkDays: 5,
		weekWorkDone: buildWeekWorkDone([0, 1, 2, todayIndex]),
		calendarWeeksCount: 2,
	},
	{
		id: -2,
		goal: -2,
		goalTitle: 'Подготовка к полумарафону',
		goalCategory: 'Спорт',
		goalCategoryNameEn: 'sport',
		goalImage: '/assets/main-img/exercise.jpg',
		goalCode: 'demo-run-half-marathon',
		progressPercentage: 72,
		dailyNotes: '',
		isWorkingToday: false,
		lastUpdated: '2026-05-27',
		createdAt: '2026-04-10',
		recentEntries: [],
		workedDaysCount: 28,
		maxConsecutiveWorkDays: 9,
		weekWorkDone: buildWeekWorkDone([0, 2, 4]),
		calendarWeeksCount: 7,
	},
	{
		id: -3,
		goal: -3,
		goalTitle: 'Выучить испанский до уровня B1',
		goalCategory: 'Интеллектуальное развитие',
		goalCategoryNameEn: 'intellectual-development',
		goalImage: '/assets/main-img/language.jfif',
		goalCode: 'demo-learn-spanish',
		progressPercentage: 25,
		dailyNotes: '',
		isWorkingToday: false,
		lastUpdated: '2026-05-26',
		createdAt: '2026-05-01',
		recentEntries: [],
		workedDaysCount: 8,
		maxConsecutiveWorkDays: 4,
		weekWorkDone: buildWeekWorkDone([1, 3]),
		calendarWeeksCount: 4,
	},
];
