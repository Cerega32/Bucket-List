/**
 * Общие хелперы для синхронизации фильтров/сортировки/пагинации списков с query-параметрами URL.
 * Используются в CatalogItems, ListGoalsFilters, UserSelfProgress, UserSelfRegular,
 * GoalFolderManager, MergeRequestsList — чтобы кнопка "назад" в браузере восстанавливала
 * ровно то состояние списка, которое было до перехода на другую страницу.
 */

export function getSingleValueParam(searchParams: URLSearchParams, key: string): string[] {
	const value = searchParams.get(key);
	return value ? [value] : [];
}

export function getMultiValueParam(searchParams: URLSearchParams, key: string): string[] {
	return searchParams.get(key)?.split(',').filter(Boolean) ?? [];
}

export function getSortIndexParam(searchParams: URLSearchParams, key: string, options: Array<{value: string}>): number {
	const value = searchParams.get(key);
	if (!value) return 0;
	const index = options.findIndex((option) => option.value === value);
	return index >= 0 ? index : 0;
}

export function getPageParam(searchParams: URLSearchParams, key = 'page'): number {
	const raw = Number(searchParams.get(key));
	return Number.isFinite(raw) && raw > 1 ? Math.floor(raw) : 1;
}

export function setOrDeleteParam(params: URLSearchParams, key: string, value: string | null | undefined): void {
	if (value) {
		params.set(key, value);
	} else {
		params.delete(key);
	}
}
