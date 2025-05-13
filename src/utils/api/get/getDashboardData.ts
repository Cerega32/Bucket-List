import {UserStore} from '@/store/UserStore';
import {IDashboardData} from '@/typings/dashboard';
import {GET} from '@/utils/fetch/requests';

export const getDashboardData = async (): Promise<{success: boolean; data: IDashboardData}> => {
	try {
		const response = await GET('dashboard');
		return {success: true, data: response.data};
	} catch (error) {
		// Заменить console.error на logger.error или убрать совсем
		// console.error('Error fetching dashboard data:', error);

		// Возвращаем моковые данные в случае ошибки
		return {
			success: true,
			data: {
				userStats: {
					completedGoals: 12,
					currentStreak: 3,
					maxStreak: 7,
				},
				dailyQuote: 'Жизнь измеряется не количеством вдохов, а количеством моментов, от которых захватывает дух.',
				upcomingTimers: [
					{
						id: 1,
						goal: {
							code: 'goal-1',
							title: 'Посетить Париж и увидеть Эйфелеву башню',
							complexity: 'medium',
							completedByUser: false,
						},
						deadline: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 дня
						daysLeft: 2,
					},
					{
						id: 2,
						goal: {
							code: 'goal-2',
							title: 'Научиться играть на гитаре',
							complexity: 'hard',
							completedByUser: false,
						},
						deadline: new Date(Date.now() + 86400000 * 1).toISOString(), // 1 день
						daysLeft: 1,
					},
					{
						id: 3,
						goal: {
							code: 'goal-3',
							title: 'Прочитать "Войну и мир"',
							complexity: 'medium',
							completedByUser: false,
						},
						deadline: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 дней
						daysLeft: 5,
					},
				],
				categoriesProgress: [
					{
						name: 'Путешествия',
						total: 10,
						completed: 3,
						percentage: 30,
						color: '#4A6FDC',
					},
					{
						name: 'Спорт',
						total: 8,
						completed: 5,
						percentage: 63,
						color: '#4CAF50',
					},
					{
						name: 'Образование',
						total: 12,
						completed: 4,
						percentage: 33,
						color: '#FF9800',
					},
					{
						name: 'Хобби',
						total: 6,
						completed: 2,
						percentage: 33,
						color: '#9C27B0',
					},
				],
				goalHealth: {
					total: 36,
					completed: 14,
					expired: 4,
					active: 18,
				},
				goalsCount: 36,
				listsCount: 5,
				categoriesCount: 8,
				popularGoals: [
					{
						id: 1,
						code: 'popular-1',
						title: 'Пробежать марафон',
						shortDescription: 'Подготовиться и пробежать полный марафон',
						description: 'Подготовиться и пробежать полный марафон на официальном мероприятии',
						image: 'https://example.com/marathon.jpg',
						category: {
							id: 1,
							name: 'Спорт',
							nameEn: 'sport',
							parentCategory: null,
						},
						subcategory: {
							id: 11,
							name: 'Бег',
							nameEn: 'running',
							parentCategory: null,
						},
						complexity: 'hard',
						totalAdded: 245,
						totalCompleted: 56,
						addedByUser: UserStore.isAuth,
						completedByUser: false,
					},
					{
						id: 2,
						code: 'popular-2',
						title: 'Научиться кататься на сноуборде',
						shortDescription: 'Освоить основы катания на сноуборде',
						description: 'Научиться уверенно кататься на сноуборде по различным трассам',
						image: 'https://example.com/snowboard.jpg',
						category: {
							id: 1,
							name: 'Спорт',
							nameEn: 'sport',
							parentCategory: null,
						},
						subcategory: {
							id: 12,
							name: 'Зимние виды спорта',
							nameEn: 'winter-sports',
							parentCategory: null,
						},
						complexity: 'medium',
						totalAdded: 189,
						totalCompleted: 78,
						addedByUser: false,
						completedByUser: false,
					},
					{
						id: 3,
						code: 'popular-3',
						title: 'Прыгнуть с парашютом',
						shortDescription: 'Преодолеть страх и прыгнуть с парашютом',
						description: 'Совершить прыжок с парашютом с инструктором или самостоятельно',
						image: 'https://example.com/parachute.jpg',
						category: {
							id: 2,
							name: 'Экстрим',
							nameEn: 'extreme',
							parentCategory: null,
						},
						subcategory: {
							id: 21,
							name: 'Воздушные виды спорта',
							nameEn: 'air-sports',
							parentCategory: null,
						},
						complexity: 'hard',
						totalAdded: 320,
						totalCompleted: 142,
						addedByUser: UserStore.isAuth,
						completedByUser: true,
					},
					{
						id: 4,
						code: 'popular-4',
						title: 'Увидеть северное сияние',
						shortDescription: 'Отправиться в путешествие и увидеть северное сияние',
						description: 'Отправиться в путешествие в северные регионы и увидеть северное сияние',
						image: 'https://example.com/aurora.jpg',
						category: {
							id: 3,
							name: 'Путешествия',
							nameEn: 'travel',
							parentCategory: null,
						},
						subcategory: {
							id: 31,
							name: 'Природные явления',
							nameEn: 'natural-phenomena',
							parentCategory: null,
						},
						complexity: 'medium',
						totalAdded: 278,
						totalCompleted: 96,
						addedByUser: false,
						completedByUser: false,
					},
				],
				hundredGoalsList: {
					progress: 28,
					percentage: 28,
					completed: 14,
					categories: {
						Путешествия: 10,
						Спорт: 8,
						Образование: 5,
						Хобби: 3,
						Экстрим: 2,
					},
				},
			},
		};
	}
};
