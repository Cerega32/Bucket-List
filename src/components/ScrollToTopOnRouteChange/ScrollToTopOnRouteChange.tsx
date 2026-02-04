import {FC, useEffect, useRef} from 'react';
import {useLocation} from 'react-router-dom';

/** Если передан — прокрутка выполняется только когда функция возвращает true. Иначе — всегда прокручиваем наверх. */
export interface ScrollToTopOnRouteChangeProps {
	shouldScroll?: (prevPathname: string, pathname: string) => boolean;
}

export const ScrollToTopOnRouteChange: FC<ScrollToTopOnRouteChangeProps> = ({shouldScroll}) => {
	const {pathname} = useLocation();
	const prevPathnameRef = useRef(pathname);

	useEffect(() => {
		const prev = prevPathnameRef.current;
		prevPathnameRef.current = pathname;

		const doScroll = shouldScroll ? shouldScroll(prev, pathname) : true;
		if (doScroll) {
			window.scrollTo(0, 0);
		}
	}, [pathname, shouldScroll]);

	return null;
};
