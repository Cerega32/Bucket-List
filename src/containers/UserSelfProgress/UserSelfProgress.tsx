import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo, useState} from 'react';
import {useLocation} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {RegularCard} from '@/components/Card/RegularCard';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {FiltersCheckbox} from '@/components/FiltersCheckbox/FiltersCheckbox';
import {Line} from '@/components/Line/Line';
import {Loader} from '@/components/Loader/Loader';
import Select, {OptionSelect} from '@/components/Select/Select';
import {Switch} from '@/components/Switch/Switch';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ModalStore} from '@/store/ModalStore';
import {getGoalsInProgress, IGoalProgress, updateGoalProgress} from '@/utils/api/goals';

import '@/components/CatalogItems/catalog-items.scss';
import './user-self-progress.scss';

const SORT_OPTIONS: OptionSelect[] = [
	{name: 'По прогрессу (убыв.)', value: 'progress_desc'},
	{name: 'По прогрессу (возр.)', value: 'progress_asc'},
	{name: 'По названию', value: 'title_asc'},
	{name: 'По дате обновления', value: 'last_updated_desc'},
];

export const UserSelfProgress: FC = observer(() => {
	const [block, element] = useBem('user-self-progress');
	const location = useLocation();
	const activeTab = (location.hash === '#all' ? 'all' : 'today') as 'today' | 'all';

	const [goals, setGoals] = useState<IGoalProgress[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [activeSort, setActiveSort] = useState(0);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

	const categoryFilters = useMemo(() => {
		const map = new Map<string, string>();
		goals.forEach((g) => {
			if (g.goalCategory && !map.has(g.goalCategory)) map.set(g.goalCategory, g.goalCategory);
		});
		return Array.from(map.values()).map((name) => ({name, code: name}));
	}, [goals]);

	const filteredGoals = useMemo(() => {
		let result = [...goals];
		if (activeTab === 'today') {
			result = result.filter((g) => g.isWorkingToday);
		}
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter((g) => g.goalTitle.toLowerCase().includes(q));
		}
		if (selectedCategories.length > 0) {
			result = result.filter((g) => selectedCategories.includes(g.goalCategory));
		}
		const sortKey = SORT_OPTIONS[activeSort]?.value;
		if (sortKey === 'progress_desc') {
			result.sort((a, b) => b.progressPercentage - a.progressPercentage);
		} else if (sortKey === 'progress_asc') {
			result.sort((a, b) => a.progressPercentage - b.progressPercentage);
		} else if (sortKey === 'title_asc') {
			result.sort((a, b) => a.goalTitle.localeCompare(b.goalTitle));
		} else if (sortKey === 'last_updated_desc') {
			result.sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));
		}
		return result;
	}, [goals, activeTab, search, selectedCategories, activeSort]);

	const handleSearchChange = (value: string) => setSearch(value);
	const handleCategoryFilter = (selected: string[]) => setSelectedCategories(selected);
	const handleSortSelect = (index: number) => setActiveSort(index);

	const {setIsOpen, setWindow, setModalProps} = ModalStore;

	const loadGoalsInProgress = async () => {
		setIsLoading(true);
		try {
			const response = await getGoalsInProgress();
			if (response.success && response.data) {
				// Фильтруем цели с прогрессом < 100% - все цели в процессе выполнения
				// Если цель есть в базе прогресса, значит она начата
				setGoals(response.data);
			}
		} catch (error) {
			console.error('Ошибка загрузки целей в процессе:', error);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		loadGoalsInProgress();
	}, []);

	const openProgressModal = (goal: IGoalProgress) => {
		setWindow('progress-update');
		setIsOpen(true);
		setModalProps({
			goalId: goal.goal,
			goalTitle: goal.goalTitle,
			currentProgress: goal,
			onProgressUpdate: (updatedProgress: IGoalProgress) => {
				// Если цель завершена (100%), удаляем её из списка
				if (updatedProgress.progressPercentage >= 100) {
					setGoals(goals.filter((g) => g.id !== updatedProgress.id));
				} else {
					// Иначе обновляем данные цели
					setGoals(goals.map((g) => (g.id === updatedProgress.id ? updatedProgress : g)));
				}
			},
			onGoalCompleted: () => {
				// Удаляем цель из списка при завершении
				setGoals(goals.filter((g) => g.id !== goal.id));
			},
		});
	};

	const markToday = async (goal: IGoalProgress) => {
		try {
			const updateResponse = await updateGoalProgress(goal.goal, {
				progress_percentage: goal.progressPercentage,
				daily_notes: goal.dailyNotes || '',
				is_working_today: !goal.isWorkingToday,
			});

			if (updateResponse.success && updateResponse.data) {
				setGoals(goals.map((g) => (g.id === goal.id ? updateResponse.data! : g)));
			}
		} catch (error) {
			console.error('Ошибка отметки «работаю сегодня»:', error);
		}
	};

	const markGoalCompleted = async (goal: IGoalProgress) => {
		try {
			const updateResponse = await updateGoalProgress(goal.goal, {
				progress_percentage: 100,
				daily_notes: goal.dailyNotes || '',
				is_working_today: true,
			});

			if (updateResponse.success) {
				setGoals(goals.filter((g) => g.id !== goal.id));
			}
		} catch (error) {
			console.error('Ошибка отметки цели как выполненной:', error);
		}
	};

	if (isLoading) {
		return <Loader isLoading />;
	}

	const todayCount = goals.filter((g) => g.isWorkingToday).length;
	const buttonsSwitch = [
		{url: '#today', name: 'Работаю сегодня', page: 'today' as const, count: todayCount},
		{url: '#all', name: 'Все цели', page: 'all' as const, count: goals.length},
	];

	return (
		<section className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Прогресс целей
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
							id="user-self-progress-search"
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
							<Select options={SORT_OPTIONS} activeOption={activeSort} onSelect={handleSortSelect} filter />
						</div>
					</div>
				</div>

				{goals.length === 0 ? (
					<EmptyState title="Нет целей в процессе" description="Начните выполнение целей, чтобы отслеживать прогресс здесь">
						<Button theme="blue" type="Link" href="/user/self/active-goals">
							Перейти к активным целям
						</Button>
					</EmptyState>
				) : filteredGoals.length === 0 ? (
					<EmptyState
						title={activeTab === 'today' ? 'Нет целей «работаю сегодня»' : 'Нет целей по фильтрам'}
						description="Измените фильтры или поиск"
					/>
				) : (
					<div className={element('goals-grid')} id="user-self-progress-goals">
						{filteredGoals.map((goal) => (
							<RegularCard
								key={goal.id}
								variant="progress"
								progressGoal={goal}
								onOpenProgressModal={() => openProgressModal(goal)}
								onMarkToday={() => markToday(goal)}
								onMarkCompleted={() => markGoalCompleted(goal)}
								className="catalog-items__goal catalog-items__goal--full"
							/>
						))}
					</div>
				)}
			</div>
		</section>
	);
});
