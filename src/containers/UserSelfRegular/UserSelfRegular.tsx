import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo, useState} from 'react';
import {useLocation} from 'react-router-dom';

import {Card} from '@/components/Card/Card';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {FiltersCheckbox} from '@/components/FiltersCheckbox/FiltersCheckbox';
import {Line} from '@/components/Line/Line';
import {Loader} from '@/components/Loader/Loader';
import Select, {OptionSelect} from '@/components/Select/Select';
import {Switch} from '@/components/Switch/Switch';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {CategoriesStore} from '@/store/CategoriesStore';
import {NotificationStore} from '@/store/NotificationStore';
import {getRegularGoalStatistics, IRegularGoalStatistics, markRegularProgress} from '@/utils/api/goals';
import './user-self-regular.scss';

interface UserSelfRegularProps {
	className?: string;
}

export const UserSelfRegular: FC<UserSelfRegularProps> = observer(({className}) => {
	const [block, element] = useBem('user-self-regular', className);
	const location = useLocation();
	const activeTab = (location.hash === '#all' ? 'all' : 'today') as 'today' | 'all';

	const [statisticsData, setStatisticsData] = useState<IRegularGoalStatistics[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [activeSort, setActiveSort] = useState(0);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

	const sortOptions: OptionSelect[] = [
		{
			name: 'Новые',
			value: 'created_at_desc',
		},
		{
			name: 'Старые',
			value: 'created_at_asc',
		},
		{
			name: 'Лучший прогресс',
			value: 'progress_desc',
		},
	];

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

	const categoryFilters = useMemo(() => {
		const categoriesMap = new Map<string, string>();

		statisticsData.forEach((stats) => {
			if (stats?.regularGoalData.goalCategory) {
				const name = stats.regularGoalData.goalCategory;
				if (!categoriesMap.has(name)) {
					categoriesMap.set(name, name);
				}
			}
		});

		return Array.from(categoriesMap.values()).map((name) => ({
			name,
			code: name,
		}));
	}, [statisticsData]);

	const filteredStatistics = () => {
		let result = [...statisticsData];

		if (search.trim()) {
			const query = search.trim().toLowerCase();
			result = result.filter((stats) => stats?.regularGoalData.goalTitle.toLowerCase().includes(query));
		}

		if (selectedCategories.length > 0) {
			result = result.filter((stats) => selectedCategories.includes(stats.regularGoalData.goalCategory));
		}

		const sortKey = sortOptions[activeSort]?.value;

		if (sortKey === 'created_at_desc') {
			result.sort((a, b) => (b.regularGoalData.createdAt || '').localeCompare(a.regularGoalData.createdAt || ''));
		} else if (sortKey === 'created_at_asc') {
			result.sort((a, b) => (a.regularGoalData.createdAt || '').localeCompare(b.regularGoalData.createdAt || ''));
		} else if (sortKey === 'progress_desc') {
			result.sort((a, b) => (b.completionPercentage || 0) - (a.completionPercentage || 0));
		}

		return result;
	};

	const handleSortSelect = async (active: number): Promise<void> => {
		setActiveSort(active);
	};

	const handleSearchChange = (value: string) => {
		setSearch(value);
	};

	const handleCategoryFilter = async (selected: string[]) => {
		setSelectedCategories(selected);
	};

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

	const getTodayGoals = () => {
		return filteredStatistics().filter(
			(stats) =>
				stats && (stats.canCompleteToday || stats.currentPeriodProgress?.completedToday || stats.nextTargetDate || stats.isActive)
		);
	};

	const getAllGoals = () => {
		return filteredStatistics();
	};

	const todayGoals = getTodayGoals();
	const allGoals = getAllGoals();

	const buttonsSwitch = [
		{
			url: '#today',
			name: 'На сегодня',
			page: 'today',
			count: todayGoals.length,
		},
		{
			url: '#all',
			name: 'Все цели',
			page: 'all',
			count: allGoals.length,
		},
	];

	// Функция для поиска категории по имени в дереве категорий
	const findCategoryByName = (name: string, categories: any[]): any => {
		const found = categories.find((category) => category.name === name);
		if (found) {
			return found;
		}

		const foundInChildren = categories
			.filter((category) => category.children && category.children.length > 0)
			.map((category) => findCategoryByName(name, category.children))
			.find((result) => result !== null);

		return foundInChildren || null;
	};

	// Конвертируем статистику в формат IGoal для совместимости с RegularGoalCard
	const convertStatsToGoal = (stats: IRegularGoalStatistics): any => {
		const categoryName = stats.regularGoalData.goalCategory;
		const foundCategory = findCategoryByName(categoryName, CategoriesStore.categoriesTree);
		const categoryNameEn = foundCategory?.nameEn || categoryName;

		return {
			id: stats.regularGoalData.goal,
			title: stats.regularGoalData.goalTitle,
			description: '',
			shortDescription: '',
			category: {
				id: foundCategory?.id || 0,
				name: categoryName,
				nameEn: categoryNameEn,
				parentCategory: foundCategory?.parentCategory || null,
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

	const renderGoalsList = (statsArray: IRegularGoalStatistics[], emptyMessage: string) => {
		if (statsArray.length === 0) {
			return <EmptyState title={emptyMessage} className={element('empty-section')} />;
		}

		return (
			<div className={element('goals-grid')}>
				{statsArray.map((stats) => {
					const goal = convertStatsToGoal(stats);

					return (
						<Card
							key={stats.regularGoal}
							mode="regular"
							regularGoal={goal}
							statistics={stats}
							onMarkRegular={() => handleProgressUpdate(stats.regularGoal)}
							className="catalog-items__goal catalog-items__goal--full"
						/>
					);
				})}
			</div>
		);
	};

	if (isLoading) {
		return <Loader isLoading />;
	}

	if (statisticsData.length === 0) {
		return (
			<div className={block()}>
				<Title tag="h2" className={element('title')}>
					Регулярные цели
				</Title>
				<EmptyState
					title="У вас пока нет регулярных целей"
					description="Создайте цель и настройте для неё регулярность выполнения!"
				/>
			</div>
		);
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Регулярные цели
				</Title>
			</div>

			<div className={element('content')}>
				<div className="catalog-items__filters">
					<Switch className="catalog-items__switch" buttons={buttonsSwitch} active={activeTab} />
					<Line className="catalog-items__line" />
					<div className="catalog-items__search-wrapper catalog-items__search-wrapper--wrap-on-lg">
						<FieldInput
							className="catalog-items__search"
							placeholder="Поиск по названию цели"
							id="user-self-regular-search"
							value={search}
							setValue={handleSearchChange}
							iconBegin="search"
						/>
						<div className="catalog-items__categories-wrapper">
							{categoryFilters.length > 0 && (
								<FiltersCheckbox
									head={{name: 'Все категории', code: 'all'}}
									items={categoryFilters}
									onFinish={handleCategoryFilter}
									multipleSelectedText={['категория', 'категории', 'категорий']}
									multipleThreshold={1}
								/>
							)}
							<Select options={sortOptions} activeOption={activeSort} onSelect={handleSortSelect} filter />
						</div>
					</div>
				</div>

				{activeTab === 'today'
					? renderGoalsList(todayGoals, 'На сегодня нет регулярных целей')
					: renderGoalsList(allGoals, 'Нет регулярных целей')}
			</div>
		</div>
	);
});
