import {CompareFriendData} from '@/components/CompareFriendModal/CompareFriendModal';
import {IComment} from '@/typings/comments';
import {ICategory, IGoal, IGoalFolder, IRegularGoalStatistics, IShortGoal, IShortList} from '@/typings/goal';
import {IUserStatistics, IWeeklyProgressItem} from '@/typings/user';
import {IGoalProgressEntry} from '@/utils/api/goals';
import {GoalWithLocation} from '@/utils/mapApi';

export type ShowcaseScenarioId =
	| 'organize'
	| 'folders'
	| 'hundred'
	| 'friends'
	| 'goalProgress'
	| 'habits'
	| 'travel'
	| 'impressions'
	| 'dashboard'
	| 'roadmap';

export type ShowcaseScenario = {
	id: ShowcaseScenarioId;
	navLabel: string;
	problem: string;
	solution: string;
	icon: string;
};

export const SHOWCASE_SCENARIOS: ShowcaseScenario[] = [
	{
		id: 'organize',
		navLabel: 'Мечты в одном месте',
		problem:
			'Записал «сходить на теннис» в заметках телефона, «выучить испанский» — на стикере, а «позвонить родителям» — в голове. ' +
			'Потом не найти и не собрать это в один план.',
		solution:
			'Каждое желание — отдельная цель с описанием, сложностью и прогрессом. ' +
			'Добавляй из каталога или создавай свои — ничего не потеряется между приложениями.',
		icon: 'apps',
	},
	{
		id: 'folders',
		navLabel: 'Разложи по полочкам',
		problem: 'Цели из разных сфер смешиваются в одной куче, а готовые подборки из каталога теряются среди личных планов.',
		solution: 'Папки для своих целей и списки из каталога в одном рабочем пространстве — только ты решаешь, что куда положить.',
		icon: 'folder-open',
	},
	{
		id: 'hundred',
		navLabel: '100 целей',
		problem:
			'Хочешь попробовать что-то по-настоящему новое — скалолазание, волонтёрство, свой подкаст — и не забыть важные моменты, которые уже были.',
		solution:
			'Список «100 целей» уже собран для старта: лёгкие, средние и сложные. Отмечай выполненное — и видишь, как жизнь наполняется смыслом.',
		icon: 'star',
	},
	{
		id: 'friends',
		navLabel: 'Друзья',
		problem: 'Один дома закрываешь цели, а мотивации не хватает. Друзья далеко — и кажется, что никто не видит твой прогресс.',
		solution:
			'Соревнуйся с друзьями онлайн: кто выполнил больше, кто впереди в «100 целей», кто активнее на сайте. ' +
			'Один челлендж вместе — или гонка на скорость.',
		icon: 'people',
	},
	{
		id: 'goalProgress',
		navLabel: 'Прогресс цели',
		problem: 'Начал читать толстую книгу и хочешь видеть, как движешься по дням — не только «прочитал / не прочитал».',
		solution: 'У цели с прогрессом — история по дням: проценты, заметки, отметки «работал над целью». Как дневник, только с цифрами.',
		icon: 'signal',
	},
	{
		id: 'habits',
		navLabel: 'Привычки',
		problem: 'Хочешь выработать привычку — зарядку каждое утро — но через неделю рука сама тянется отложить «на завтра».',
		solution: 'Регулярные цели с сериями и недельным ритмом: отметил день — видишь streak. Система напоминает ритм, а не морализирует.',
		icon: 'regular-empty',
	},
	{
		id: 'travel',
		navLabel: 'Карта',
		problem: 'Был в Париже, Токио и на даче у бабушки — а где ты уже побывал, если собрать всё в одну картину мира?',
		solution: 'Карта путешествий: отмечай точки по целям, смотри посещённые места и планируй следующие.',
		icon: 'map',
	},
	{
		id: 'impressions',
		navLabel: 'Впечатления',
		problem: 'Сходил на концерт или в новый город — выложить фото в ленту скучно, а эмоции через месяц забудутся.',
		solution: 'Оставь впечатление к цели: текст, фото, реакции. Смотри, как это сделали другие — и разнообразишь свою галерею.',
		icon: 'comment',
	},
	{
		id: 'dashboard',
		navLabel: 'Статистика',
		problem: 'Жаль, что в жизни нет экрана персонажа — уровня, серии, графика активности.',
		solution: 'Здесь он есть: уровень и опыт, цели по неделям, годовая карта активности — вся история роста на одном дашборде.',
		icon: 'level',
	},
];

export const ROADMAP_SCENARIO: ShowcaseScenario = {
	id: 'roadmap',
	navLabel: 'Скоро',
	problem: '',
	solution: 'Функции, которые уже в разработке — мы открываем планы заранее.',
	icon: 'rocket',
};

export type ComingSoonItem = {
	icon: string;
	title?: string;
	description: string;
	iconAccent?: 'red';
};

export const COMING_SOON_ITEMS: ComingSoonItem[] = [
	{
		icon: 'people',
		title: 'Лента друзей',
		description: 'Активность друзей в одной ленте — кто что закрыл и куда движется.',
	},
	{
		icon: 'trophy',
		title: 'Вызов другу',
		description: 'Брось вызов: кто быстрее выполнит цель или наберёт больше очков за срок.',
	},
	{
		icon: 'level',
		title: 'Еженедельные задания',
		description: 'Короткие челленджи на неделю с бонусным опытом.',
	},
	{
		icon: 'bullseye',
		title: 'Цель на сегодня',
		description: 'Платформа предложит одну цель, с которой логично начать день.',
		iconAccent: 'red',
	},

	{
		icon: 'award',
		title: 'Подарки друг другу',
		description: 'Отправляй друзьям мотивационные подарки и бонусы на платформе.',
	},
	{
		icon: 'star',
		title: 'Итоги года',
		description: 'Персональная сводка: цели, карта, впечатления и рекорды за год.',
	},
	{
		icon: 'rocket',
		description: 'Но это еще не все! Мы работаем над новыми функциями и улучшениями, которые помогут тебе достичь большего.',
	},
];

const cat = (id: number, name: string, nameEn: string): ICategory => ({
	id,
	name,
	nameEn,
	parentCategory: null,
});

const CATEGORY_SPORT = cat(1, 'Спорт', 'sport');
const CATEGORY_CINEMA = cat(2, 'Киноискусство', 'cinema-art');
const CATEGORY_COMMUNITY = cat(3, 'Общественный вклад', 'community-contribution');
const CATEGORY_RELATIONS = cat(4, 'Дружба и общение', 'friendship-and-communication');
const CATEGORY_CULTURAL = cat(4, 'Культурное погружение', 'cultural-immersion');
const CATEGORY_MUSIC = cat(5, 'Музыкальные впечатления', 'musical-experiences');
const CATEGORY_WELLNESS = cat(6, 'Благополучие и здоровье', 'wellness-and-health');
const CATEGORY_CAREER = cat(7, 'Карьера и профессиональный рост', 'career-success');
const CATEGORY_BOOKS = cat(9, 'Книги', 'books');
const CATEGORY_CREATIVE_ARTS = cat(10, 'Творческие искусства', 'creative-arts');

export const DEMO_HUNDRED_GOALS = {
	totalAddedEasy: 34,
	totalAddedMedium: 33,
	totalAddedHard: 33,
	totalCompletedEasy: 16,
	totalCompletedMedium: 10,
	totalCompletedHard: 2,
};

const makeShortGoal = (
	id: number,
	code: string,
	title: string,
	shortDescription: string,
	image: string,
	category: ICategory,
	completedByUser: boolean
): IShortGoal => ({
	id,
	code,
	title,
	shortDescription,
	description: shortDescription,
	image,
	complexity: 'easy',
	category,
	subcategory: category,
	totalAdded: 500,
	totalCompleted: 120,
	completedByUser,
	addedByUser: true,
});

export const DEMO_ORGANIZE_GOALS: IShortGoal[] = [
	makeShortGoal(
		104,
		'demo-parachute',
		'Сходить на теннис',
		'Записал в заметках два года назад — пора перенести в реальный план.',
		'/assets/main-img/tennis.jfif',
		CATEGORY_SPORT,
		false
	),
	makeShortGoal(
		105,
		'demo-marathon',
		'Позвонить родителям',
		'Родители ждут звонка, а ты забываешь.',
		'/assets/main-img/parents.jfif',
		CATEGORY_RELATIONS,
		true
	),
	makeShortGoal(
		107,
		'demo-spanish',
		'Выучить фразы для путешествия',
		'Больше не на стикере — с прогрессом в приложении',
		'/assets/main-img/language.jfif',
		CATEGORY_CULTURAL,
		false
	),
];

export const DEMO_HUNDRED_CARD_GOALS: IShortGoal[] = [
	makeShortGoal(
		101,
		'demo-new-sport',
		'Освоить новый вид спорта',
		'Найди спорт, который станет источником силы — не «когда-нибудь», а в календаре.',
		'/assets/main-img/new-sport.jpg',
		CATEGORY_SPORT,
		true
	),
	makeShortGoal(
		102,
		'demo-kinopoisk-100',
		'Посмотреть топ-100 Кинопоиска',
		'Кинопутешествие через шедевры всех времён — с отметками прогресса.',
		'/assets/main-img/top-100.jpg',
		CATEGORY_CINEMA,
		true
	),
	makeShortGoal(
		103,
		'demo-someone-dream',
		'Исполнить чью-то мечту',
		'Стать причиной чьей-то улыбки — подари эмоцию, просто потому что можешь.',
		'/assets/main-img/dream.jpg',
		CATEGORY_COMMUNITY,
		false
	),
];

const makeShortList = (
	code: string,
	title: string,
	shortDescription: string,
	image: string,
	category: ICategory,
	completedByUser: boolean,
	addedByUser = false
): IShortList => ({
	code,
	title,
	shortDescription,
	image,
	category,
	complexity: 'medium',
	totalCompleted: 80,
	totalAdded: 320,
	addedByUser,
	completedByUser,
	userCompletedGoals: completedByUser ? 24 : 4,
	goalsCount: 24,
});

export const DEMO_CATALOG_LISTS: IShortList[] = [
	makeShortList(
		'demo-holidays-list',
		'Национальные фестивали мира',
		'Культурные события разных стран — традиции, история, атмосфера.',
		'/assets/main-img/holiday-list.jfif',
		CATEGORY_CULTURAL,
		false
	),
	makeShortList(
		'demo-music-list',
		'Музыкальное самообразование',
		'Цели для тех, кто хочет глубже понимать музыку.',
		'/assets/main-img/music-list.jfif',
		CATEGORY_MUSIC,
		true
	),
];

export const DEMO_SHOWCASE_FOLDERS: IGoalFolder[] = [
	{
		id: 1,
		name: 'Планы на лето',
		description: 'Путешествия и отдых — только твои цели',
		color: '#3A89D8',
		icon: 'folder-open',
		isPrivate: true,
		createdAt: '2025-06-01',
		updatedAt: '2026-05-01',
		goalsCount: 12,
	},
	{
		id: 2,
		name: 'Карьера 2026',
		description: 'Рабочие задачи и навыки',
		color: '#7C3AED',
		icon: 'folder-open',
		isPrivate: true,
		createdAt: '2025-01-01',
		updatedAt: '2026-05-01',
		goalsCount: 8,
	},
	{
		id: 3,
		name: 'С близкими',
		description: 'Совместные планы и подарки',
		color: '#10B981',
		icon: 'folder-open',
		isPrivate: true,
		createdAt: '2025-03-01',
		updatedAt: '2026-05-01',
		goalsCount: 5,
	},
];

const loc = (
	id: number,
	name: string,
	country: string,
	lat: number,
	lon: number,
	visited: boolean,
	address?: string,
	description?: string
): GoalWithLocation => ({
	location: {
		id,
		name,
		country,
		latitude: lat,
		longitude: lon,
		place_type: 'landmark',
		address,
		created_at: '2025-01-01',
	},
	userVisitedLocation: visited,
	name,
	address,
	description,
});

export const DEMO_WORLD_MAP_GOALS: GoalWithLocation[] = [
	loc(1, 'Париж', 'Франция', 48.8566, 2.3522, true, 'Эйфелева башня, 5-й округ, Париж', 'Столица Франции'),
	loc(2, 'Токио', 'Япония', 35.6762, 139.6503, true, 'Синдзюку, Токио', 'Мегаполис неоновых кварталов и храмов.'),
	loc(3, 'Нью-Йорк', 'США', 40.7128, -74.006, true, 'Манхэттен, Нью-Йорк', 'Центральный парк, и Бруклинский мост.'),
	loc(4, 'Кейптаун', 'ЮАР', -33.9249, 18.4241, false, 'Столовая гора, Кейптаун', 'Подъём на Table Mountain.'),
	loc(5, 'Сидней', 'Австралия', -33.8688, 151.2093, false, 'Оперный театр, Сидней', 'Увидеть паруса оперного театра.'),
	loc(6, 'Рио-де-Жанейро', 'Бразилия', -22.9068, -43.1729, true, 'Копакабана, Рио-де-Жанейро', 'Пляж и карнавальная атмосфера города.'),
];

export const DEMO_COMPARE_FRIEND: CompareFriendData = {
	user: {
		id: 1,
		username: 'alex',
		firstName: 'Алексей',
		lastName: 'Иванов',
		avatar: '/assets/main-img/my-profile.png',
		level: 7,
		activity: {
			goalsCompleted: 52,
			goalsByCategory: [],
			listsCompleted: 5,
			commentsCount: 0,
			totalLikes: 0,
			locationsVisited: 0,
			achievementIds: [],
			regularCompleted: 0,
			bestWeeklyRank: null,
			hundredGoals: {easy: 16, medium: 10, hard: 2},
			siteActivity: {activeDays: 124, activityPercentage: 68},
		},
	},
	friend: {
		id: 2,
		username: 'maria_k',
		firstName: 'Мария',
		lastName: 'Козлова',
		avatar: '/assets/main-img/friend-profile.jpg',
		level: 6,
		activity: {
			goalsCompleted: 48,
			goalsByCategory: [],
			listsCompleted: 7,
			commentsCount: 0,
			totalLikes: 0,
			locationsVisited: 0,
			achievementIds: [],
			regularCompleted: 0,
			bestWeeklyRank: null,
			hundredGoals: {easy: 14, medium: 8, hard: 3},
			siteActivity: {activeDays: 98, activityPercentage: 54},
		},
	},
	achievements: [
		{
			id: 1,
			title: 'Ладно, и так сойдет...',
			image: '/assets/achievements/target-default.svg',
			isSecret: false,
			userHas: true,
			friendHas: true,
		},
		{
			id: 2,
			title: null,
			image: '/assets/achievements/dracula.svg',
			isSecret: true,
			userHas: true,
			friendHas: false,
		},
	],
};

const DEMO_WEEKLY_PROGRESS: IWeeklyProgressItem[] = [
	{weekNumber: 18, month: 4, completedGoals: 2, startDate: '2026-04-28', endDate: '2026-05-04'},
	{weekNumber: 19, month: 5, completedGoals: 4, startDate: '2026-05-05', endDate: '2026-05-11'},
	{weekNumber: 20, month: 5, completedGoals: 3, startDate: '2026-05-12', endDate: '2026-05-18'},
	{weekNumber: 21, month: 5, completedGoals: 6, startDate: '2026-05-19', endDate: '2026-05-25'},
	{weekNumber: 22, month: 5, completedGoals: 5, startDate: '2026-05-26', endDate: '2026-06-01'},
];

export const DEMO_USER_STATISTICS: IUserStatistics = {
	currentStats: {
		weeklyRank: 12,
		activeGoals: 8,
		activeLists: 2,
		level: 7,
		currentExperience: 1240,
		nextLevelExperience: 1600,
	},
	totalStats: {
		reviewsCount: 18,
		completedGoals: 52,
		completedLists: 5,
		achievementsCount: 14,
		weeklyCompletedChallenges: 0,
		totalWeeklyChallenges: 0,
	},
	weeklyProgress: DEMO_WEEKLY_PROGRESS,
	hundredGoals: {
		easy: {completed: 16, total: 34},
		medium: {completed: 10, total: 33},
		hard: {completed: 2, total: 33},
	},
};

export const DEMO_PROGRESS_ENTRIES: IGoalProgressEntry[] = [
	{
		id: 1,
		goalProgress: 1,
		date: '2026-05-18',
		percentageChange: 13,
		notes: 'Начинаем знакомство с творчеством Михаила Булгакова - как не выбрать для этого Мастер и Маргарита?',
		workDone: true,
		createdAt: '2026-05-28',
	},
	{
		id: 2,
		goalProgress: 1,
		date: '2026-05-20',
		percentageChange: 10,
		notes: 'Прочитал 40 страниц, зашёл в сюжет.',
		workDone: true,
		createdAt: '2026-05-20',
	},
	{
		id: 3,
		goalProgress: 1,
		date: '2026-05-25',
		percentageChange: 27,
		notes: 'Выходной, больше времени для чтения. Дошел до экватора книги - пора ложиться спать.',
		workDone: true,
		createdAt: '2026-05-25',
	},
	{
		id: 4,
		goalProgress: 1,
		date: '2026-05-28',
		percentageChange: 50,
		notes: 'Безумно затянуло чтение. Судьба и развитие героев - захватывающе. Закончил в субботу.',
		workDone: true,
		createdAt: '2026-05-28',
	},
];

export const DEMO_BOOK_GOAL: IShortGoal = makeShortGoal(
	106,
	'demo-read-master',
	'Прочитать «Мастер и Маргарита»',
	'Роман, который совмещает в себе философскую притчу, едкую сатиру на советский быт, ' +
		'мистическую фантасмагорию и пронзительную историю любви.',
	'/assets/main-img/m&m.jpg',
	CATEGORY_BOOKS,
	false
);

const makeRegularGoal = (id: number, code: string, title: string, shortDescription: string, image: string, category: ICategory): IGoal => ({
	id,
	code,
	title,
	shortDescription,
	description: shortDescription,
	image,
	complexity: 'easy',
	category,
	subcategory: category,
	totalAdded: 320,
	totalCompleted: 88,
	lists: [],
	listsCount: 0,
	completedByUser: false,
	addedByUser: true,
	totalLists: 0,
	totalComments: 0,
	addedFromList: [],
	createdAt: '2025-01-01',
	createdByUser: false,
	isCanEdit: false,
	hasMyComment: false,
	userVisitedLocation: false,
});

const makeRegularStats = (goal: IGoal, streak: number, completedToday: boolean): IRegularGoalStatistics => ({
	id: goal.id,
	user: 1,
	userUsername: 'demo',
	regularGoal: goal.id,
	regularGoalData: {
		id: goal.id,
		goal: goal.id,
		goalTitle: goal.title,
		goalCode: goal.code,
		goalImage: goal.image,
		goalCategory: goal.category.name,
		frequency: 'daily',
		durationType: 'indefinite',
		allowSkipDays: 2,
		resetOnSkip: false,
		isActive: true,
		createdAt: '2025-01-01',
		updatedAt: '2026-05-01',
	},
	totalCompletions: 42,
	totalDays: 60,
	completionPercentage: 70,
	currentStreak: streak,
	maxStreak: streak + 4,
	totalWeeks: 8,
	completedWeeks: 6,
	currentWeekCompletions: 5,
	isActive: true,
	isPaused: false,
	resetCount: 0,
	canCompleteToday: !completedToday,
	createdAt: '2025-01-01',
	updatedAt: '2026-05-01',
	currentPeriodProgress: {
		type: 'daily',
		completedToday,
		streak,
	},
});

const photoshopGoal = makeRegularGoal(
	301,
	'demo-daily-water',
	'Освоить азы Photoshop',
	'Посмотрел видеоуроки, сделал несколько простых фотографий. Теперь знаю, как делать основные операции.',
	'/assets/main-img/photoshop.webp',
	CATEGORY_CAREER
);

const exerciseGoal = makeRegularGoal(
	302,
	'demo-daily-exercise',
	'Зарядка каждый день',
	'10–15 минут лёгких упражнений — проснуться и улыбнуться новому дню.',
	'/assets/main-img/exercise.jpg',
	CATEGORY_WELLNESS
);

const activityGoal = makeRegularGoal(
	303,
	'demo-daily-activity',
	'Выходной с друзьями',
	'Посидели с друзьями, попили чая, поели конфет. Стабильно каждый выходной. Это мой привычный ритм.',
	'/assets/main-img/friends.jfif',
	CATEGORY_RELATIONS
);

export const DEMO_HABIT_ITEMS = [
	{goal: exerciseGoal, statistics: makeRegularStats(exerciseGoal, 12, true)},
	{goal: photoshopGoal, statistics: makeRegularStats(photoshopGoal, 1, false)},
	{goal: activityGoal, statistics: makeRegularStats(activityGoal, 7, false)},
];

export const DEMO_COMMENT: IComment = {
	id: 1,
	complexity: 'medium',
	dateCreated: '2026-05-15T14:00:00Z',
	dislikesCount: 0,
	hasDisliked: false,
	hasLiked: false,
	likesCount: 24,
	photos: [
		{id: 1, image: '/assets/main-img/live_1.jpg'},
		{id: 2, image: '/assets/main-img/live_2.jpg'},
		{id: 3, image: '/assets/main-img/live_3.webp'},
	],
	text:
		'Концерт удался — атмосфера, свет, люди рядом. Такие моменты и хочется сохранять не только в галерее телефона. ' +
		'Ещё несколько фото ниже.',
	user: 1,
	userName: 'Алексей',
	userNickname: 'alexey',
	userTotalCompletedGoals: 52,
	userAvatar: '/assets/main-img/my-profile.png',
	goalCategory: CATEGORY_CREATIVE_ARTS,
	goalInfo: {
		id: 10,
		code: 'demo-concert',
		title: 'Сходить на живой концерт',
		totalAdded: 890,
		image: '/assets/main-img/concert.jfif',
		complexity: 'medium',
	},
};
