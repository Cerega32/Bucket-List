import {FC, useEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';

/** Если передан — прокрутка наверх выполняется только когда функция возвращает true (для PUSH/REPLACE). */
export interface ScrollToTopOnRouteChangeProps {
	shouldScroll?: (prevPathname: string, pathname: string) => boolean;
}

const STORAGE_PREFIX = 'scroll-pos:';
const RESTORE_RETRY_MS = 50;
const RESTORE_TIMEOUT_MS = 2500;

// Ключ по реальному window.location (а не по location из React Router) — не зависит от того,
// когда React успел перерендерить состояние (BrowserRouter работает с future.v7_startTransition,
// т.е. обновления location идут через конкурентный рендер и могут отставать от реального события)
const getScrollKey = (): string => window.location.pathname + window.location.search;

const saveScrollPosition = (key: string, y: number): void => {
	try {
		sessionStorage.setItem(STORAGE_PREFIX + key, String(y));
	} catch {
		// sessionStorage недоступен (приватный режим и т.п.) — просто не восстанавливаем позицию
	}
};

const readScrollPosition = (key: string): number | null => {
	try {
		const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
		return raw !== null ? Number(raw) : null;
	} catch {
		return null;
	}
};

/**
 * При PUSH/REPLACE — скролл наверх (с исключениями через shouldScroll).
 * При POP (кнопка «назад»/«вперёд» браузера) — восстанавливаем сохранённую позицию скролла
 * для этого URL, с повторными попытками, пока страница догружает контент (скелетон → список).
 *
 * Сохранение/восстановление завязаны на нативные события (`scroll`, `popstate`) и window.location,
 * а не на объект location из React Router — это исключает гонки с конкурентным рендером.
 */
export const ScrollToTopOnRouteChange: FC<ScrollToTopOnRouteChangeProps> = ({shouldScroll}) => {
	const location = useLocation();
	const prevPathnameRef = useRef(location.pathname);
	const isPopRef = useRef(false);

	useEffect(() => {
		if ('scrollRestoration' in window.history) {
			window.history.scrollRestoration = 'manual';
		}

		const handleScroll = () => saveScrollPosition(getScrollKey(), window.scrollY);
		const handlePopState = () => {
			isPopRef.current = true;
		};

		window.addEventListener('scroll', handleScroll, {passive: true});
		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('popstate', handlePopState);
		};
	}, []);

	useEffect(() => {
		const prevPathname = prevPathnameRef.current;
		prevPathnameRef.current = location.pathname;

		const wasPop = isPopRef.current;
		isPopRef.current = false;

		if (wasPop) {
			const targetY = readScrollPosition(getScrollKey());
			if (!targetY || targetY <= 0) {
				return undefined;
			}

			let cancelled = false;
			const startedAt = Date.now();

			const restore = () => {
				if (cancelled) {
					return;
				}

				window.scrollTo(0, targetY);

				const closeEnough = Math.abs(window.scrollY - targetY) <= 2;
				const pageTallEnough = document.documentElement.scrollHeight >= targetY + window.innerHeight;
				if ((closeEnough && pageTallEnough) || Date.now() - startedAt >= RESTORE_TIMEOUT_MS) {
					return;
				}

				window.setTimeout(restore, RESTORE_RETRY_MS);
			};

			restore();
			return () => {
				cancelled = true;
			};
		}

		const doScroll = shouldScroll ? shouldScroll(prevPathname, location.pathname) : true;
		if (doScroll) {
			window.scrollTo(0, 0);
		}

		return undefined;
	}, [location.pathname, shouldScroll]);

	return null;
};
