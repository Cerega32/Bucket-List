import {FC, useCallback, useMemo} from 'react';
import {useSearchParams} from 'react-router-dom';

import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {FieldInput} from '@/shared/ui/FieldInput/FieldInput';
import {FilterGroup, FiltersDrawer} from '@/shared/ui/FiltersDrawer/FiltersDrawer';
import Select from '@/shared/ui/Select/Select';
import {
	EMPTY_LIST_GOALS_FILTER_VALUES,
	getListGoalsSortIndex,
	LIST_GOALS_SORT_OPTIONS,
	parseListGoalsFilterValues,
	syncListGoalsParamsToUrl,
} from '@/widgets/list-goals-filters/listGoalsFiltersUtils';

import '@/features/catalog-items/catalog-items.scss';

interface ListGoalsFiltersProps {
	className?: string;
	search: string;
	onSearchChange: (query: string) => void;
	totalCount?: number;
	showCompletionFilter?: boolean;
}

export const ListGoalsFilters: FC<ListGoalsFiltersProps> = (props) => {
	const {className, search, onSearchChange, totalCount, showCompletionFilter = true} = props;
	const [block, element] = useBem('catalog-items', className);
	const [searchParams, setSearchParams] = useSearchParams();
	const searchParamsKey = searchParams.toString();
	const {isAuth} = UserStore;

	const filterValues = useMemo(() => parseListGoalsFilterValues(searchParams), [searchParamsKey]);
	const activeSort = useMemo(() => getListGoalsSortIndex(searchParams), [searchParamsKey]);

	const drawerFilters = useMemo((): FilterGroup[] => {
		const groups: FilterGroup[] = [];

		if (isAuth && showCompletionFilter) {
			groups.push({
				key: 'completionStatus',
				label: 'Статус выполнения',
				options: [
					{name: 'Только невыполненные', code: 'not_completed'},
					{name: 'Только выполненные', code: 'completed'},
				],
				allLabel: 'Все цели',
			});
		}

		groups.push({
			key: 'complexity',
			label: 'Сложность',
			options: [
				{name: 'Легко', code: 'easy'},
				{name: 'Средне', code: 'medium'},
				{name: 'Тяжело', code: 'hard'},
			],
			allLabel: 'Все цели',
		});

		groups.push({
			key: 'goalType',
			label: 'Тип цели',
			options: [
				{name: 'Регулярные', code: 'regular'},
				{name: 'Обычные', code: 'usual'},
			],
			allLabel: 'Все цели',
		});

		return groups;
	}, [isAuth, showCompletionFilter]);

	const updateListGoalsUrl = useCallback(
		(sortValue: string, filters: Record<string, string[]>) => {
			setSearchParams((prev) => syncListGoalsParamsToUrl(prev, sortValue, filters, LIST_GOALS_SORT_OPTIONS[0].value), {
				replace: true,
			});
		},
		[setSearchParams]
	);

	const onSelect = (active: number): void => {
		updateListGoalsUrl(LIST_GOALS_SORT_OPTIONS[active].value, filterValues);
	};

	const handleFilterChange = (key: string, selected: string[]) => {
		updateListGoalsUrl(LIST_GOALS_SORT_OPTIONS[activeSort].value, {...filterValues, [key]: selected});
	};

	const handleFilterReset = () => {
		updateListGoalsUrl(LIST_GOALS_SORT_OPTIONS[activeSort].value, {...EMPTY_LIST_GOALS_FILTER_VALUES});
	};

	return (
		<section className={block()}>
			<div className={element('filters')}>
				<div className={element('search-wrapper')}>
					<FieldInput
						className={element('search')}
						placeholder="Поисковой запрос"
						id="list-goals-search"
						value={search}
						setValue={onSearchChange}
						iconBegin="search"
						iconEnd={search.trim() ? 'cross' : undefined}
						iconEndClick={search.trim() ? () => onSearchChange('') : undefined}
					/>
					<div className={element('categories-wrapper')}>
						<FiltersDrawer
							filters={drawerFilters}
							values={filterValues}
							onChange={handleFilterChange}
							onReset={handleFilterReset}
							totalCount={totalCount}
						/>
						<Select options={LIST_GOALS_SORT_OPTIONS} activeOption={activeSort} onSelect={onSelect} filter />
					</div>
				</div>
			</div>
		</section>
	);
};
