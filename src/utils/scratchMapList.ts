export const SCRATCH_MAP_LIST_TITLE = 'Глобус без пробелов';
export const COUNTRIES_LIST_TITLE = '198 стран мечты';

export const SCRATCH_MAP_PAGE_URL = '/user/self/maps#countries';

const SCRATCH_MAP_LIST_TITLES = new Set([SCRATCH_MAP_LIST_TITLE, COUNTRIES_LIST_TITLE, 'Страны и территории мира', 'Все страны мира']);

export const isScratchMapList = (list?: {title?: string; hasScratchMap?: boolean} | null): boolean =>
	Boolean(list?.hasScratchMap || (list?.title && SCRATCH_MAP_LIST_TITLES.has(list.title)));
