/** Ниже `--md` (768px): балун — панель внизу. От md и шире — балун рядом с меткой. */
export const MOBILE_MAP_MEDIA_QUERY = '(max-width: 767px)';

export const isMobileMapViewport = (): boolean => typeof window !== 'undefined' && window.matchMedia(MOBILE_MAP_MEDIA_QUERY).matches;

/** Infinity — панель внизу; 0 — обычный балун у метки. */
export const getYandexBalloonPanelMaxMapArea = (): number => (isMobileMapViewport() ? Infinity : 0);

export const syncYandexBalloonPanelMode = (map: {options?: {set: (key: string, value: number) => void}} | null | undefined): void => {
	map?.options?.set('balloonPanelMaxMapArea', getYandexBalloonPanelMaxMapArea());
};

/** Обновляет режим балуна при смене ширины (в т.ч. DevTools), без перезагрузки страницы. */
export const subscribeYandexBalloonPanelMode = (
	map: {options?: {set: (key: string, value: number) => void}} | null | undefined,
	onModeChange?: () => void
): (() => void) => {
	if (typeof window === 'undefined' || !map?.options) {
		return () => undefined;
	}

	const mediaQuery = window.matchMedia(MOBILE_MAP_MEDIA_QUERY);
	const apply = () => {
		syncYandexBalloonPanelMode(map);
		onModeChange?.();
	};

	apply();
	mediaQuery.addEventListener('change', apply);
	return () => mediaQuery.removeEventListener('change', apply);
};

export const YANDEX_MARKER_PRESET_VISITED = 'islands#greenDotIcon';
export const YANDEX_MARKER_PRESET_UNVISITED = 'islands#redDotIcon';
export const YANDEX_MARKER_PRESET_ACTIVE = 'islands#blueDotIcon';

/**
 * Если низ карты ниже видимой области — прокручивает страницу,
 * чтобы нижний край карты оказался у нижнего края экрана (балун-панель видна).
 */
export const scrollMapBottomIntoViewport = (mapEl: HTMLElement | null, padding = 8): void => {
	if (!mapEl || typeof window === 'undefined') {
		return;
	}

	const rect = mapEl.getBoundingClientRect();
	const overflow = rect.bottom - (window.innerHeight - padding);
	if (overflow <= 1) {
		return;
	}

	window.scrollBy({top: overflow, behavior: 'smooth'});
};
