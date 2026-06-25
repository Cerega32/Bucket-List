export const SCRATCH_MAP_LIST_TITLE = 'Страны и территории мира';
export const COUNTRIES_LIST_TITLE = 'Все страны мира';

export const SCRATCH_MAP_PAGE_URL = '/user/self/maps#countries';

const SCRATCH_MAP_LIST_TITLES = new Set([SCRATCH_MAP_LIST_TITLE, COUNTRIES_LIST_TITLE]);

export const isScratchMapList = (list?: {title?: string; hasScratchMap?: boolean} | null): boolean =>
	Boolean(list?.hasScratchMap || (list?.title && SCRATCH_MAP_LIST_TITLES.has(list.title)));
