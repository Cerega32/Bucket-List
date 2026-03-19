import {useCallback, useEffect, useState} from 'react';

import {ScreenMode, ScreenSizeCode} from '@/typings/screen';
import {screenSizes} from '@/utils/values/screenSizes';

const getScreenByMode = (mode: ScreenSizeCode): ScreenMode => {
	const base = {
		isScreenXs: false,
		isScreenSmallMobile: false,
		isScreenMobile: false,
		isScreenSmallTablet: false,
		isScreenTablet: false,
		isScreenDesktop: false,
	} as const;

	switch (mode) {
		case 'xxs':
			return {...base, isScreenSmallMobile: true, isScreenMobile: true, isScreenXs: true};
		case 'xs':
			return {...base, isScreenSmallMobile: true, isScreenMobile: true};
		case 'sm':
			return {...base, isScreenMobile: true};
		case 'md':
			return {...base, isScreenTablet: true, isScreenSmallTablet: true};
		case 'lg':
			return {...base, isScreenTablet: true};
		default:
			return {...base, isScreenDesktop: true};
	}
};

const getScreenSizeCode = (width: number): ScreenSizeCode => {
	if (width >= 1464) return 'xl';
	if (width >= 1200) return 'lg';
	if (width >= 768) return 'md';
	if (width >= 576) return 'sm';
	if (width >= 480) return 'xs';
	return 'xxs';
};

const useScreenSize = (): ScreenMode => {
	const [windowDimensions, setWindowDimensions] = useState<ScreenMode>(() => {
		const width = typeof window !== 'undefined' ? document.documentElement.clientWidth || window.innerWidth : 1464;
		return getScreenByMode(getScreenSizeCode(width));
	});

	const listener = useCallback(() => {
		const width = document.documentElement.clientWidth || window.innerWidth;
		setWindowDimensions(getScreenByMode(getScreenSizeCode(width)));
	}, []);

	useEffect(() => {
		const mediaQueries = screenSizes.map(({name, size}) => ({
			mediaQueryList: window.matchMedia(`(min-width: ${size}px)`),
			mode: name,
		}));

		listener();

		mediaQueries.forEach(({mediaQueryList}) => {
			if (mediaQueryList.addEventListener) {
				mediaQueryList.addEventListener('change', listener);
			} else {
				mediaQueryList.addListener(listener);
			}
		});

		return () => {
			mediaQueries.forEach(({mediaQueryList}) => {
				if (mediaQueryList.removeEventListener) {
					mediaQueryList.removeEventListener('change', listener);
				} else {
					mediaQueryList.removeListener(listener);
				}
			});
		};
	}, [listener]);

	return windowDimensions;
};

export default useScreenSize;
