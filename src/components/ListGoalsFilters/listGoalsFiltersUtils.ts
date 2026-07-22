import {OptionSelect} from '../Select/Select';

export const LIST_GOALS_SORT_OPTIONS: Array<OptionSelect> = [
	{name: 'По порядку в списке', value: 'id'},
	{name: 'Легкие', value: 'complexity'},
	{name: 'Сложные', value: '-complexity'},
	{name: 'А–Я', value: 'title'},
	{name: 'Я–А', value: '-title'},
];

export const EMPTY_LIST_GOALS_FILTER_VALUES: Record<string, string[]> = {
	completionStatus: [],
	complexity: [],
	goalType: [],
};

export function parseListGoalsFilterValues(searchParams: URLSearchParams): Record<string, string[]> {
	return {
		completionStatus: searchParams.get('completion') ? [searchParams.get('completion') as string] : [],
		complexity: searchParams.get('complexity') ? [searchParams.get('complexity') as string] : [],
		goalType: searchParams.get('goal_type') ? [searchParams.get('goal_type') as string] : [],
	};
}

export function getListGoalsSearchParam(searchParams: URLSearchParams): string {
	return searchParams.get('search') ?? '';
}

export function getListGoalsSortIndex(searchParams: URLSearchParams): number {
	const sortValue = searchParams.get('sort');
	if (!sortValue) return 0;
	const index = LIST_GOALS_SORT_OPTIONS.findIndex((option) => option.value === sortValue);
	return index >= 0 ? index : 0;
}

export function syncListGoalsParamsToUrl(
	prev: URLSearchParams,
	sortValue: string,
	filters: Record<string, string[]>,
	defaultSortValue: string
): URLSearchParams {
	const next = new URLSearchParams(prev);

	if (sortValue && sortValue !== defaultSortValue) {
		next.set('sort', sortValue);
	} else {
		next.delete('sort');
	}

	if (filters['complexity'].length > 0) {
		next.set('complexity', filters['complexity'][0]);
	} else {
		next.delete('complexity');
	}

	if (filters['goalType'].length > 0) {
		next.set('goal_type', filters['goalType'][0]);
	} else {
		next.delete('goal_type');
	}

	if (filters['completionStatus'].length > 0) {
		next.set('completion', filters['completionStatus'][0]);
	} else {
		next.delete('completion');
	}

	return next;
}

export function buildListGoalsApiQuery(searchParams: URLSearchParams, search: string): Record<string, string | number> {
	const filters = parseListGoalsFilterValues(searchParams);
	const sortIndex = getListGoalsSortIndex(searchParams);
	const {complexity, goalType, completionStatus} = filters;
	const query: Record<string, string | number> = {
		sort_by: LIST_GOALS_SORT_OPTIONS[sortIndex].value,
	};

	const trimmedSearch = search.trim();
	if (trimmedSearch.length >= 2) {
		query['search'] = trimmedSearch;
	}

	const [complexityValue] = complexity;
	if (complexityValue) {
		query['complexity'] = complexityValue;
	}

	const [goalTypeValue] = goalType;
	if (goalTypeValue) {
		query['goal_type'] = goalTypeValue;
	}

	const [completionStatusValue] = completionStatus;
	if (completionStatusValue) {
		query['completion'] = completionStatusValue;
	}

	return query;
}
