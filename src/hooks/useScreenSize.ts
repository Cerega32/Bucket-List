// import {ScreenMode, ScreenSizeCode} from '@/typings/screen';
// import {screenSizes} from '@/utils/values/screenSizes';
// import {useEffect, useState} from 'react';

// const getScreenByMode = (mode: ScreenSizeCode): ScreenMode => {
// 	const base = {
// 		isScreenMobile: false,
// 		isScreenSmallTablet: false,
// 		isScreenTablet: false,
// 		isScreenDesktop: false,
// 	} as const;

// 	if (mode === 'xs' || mode === 'sm') {
// 		return {...base, isScreenMobile: true};
// 	}

// 	if (mode === 'md' || mode === 'lg') {
// 		return mode === 'md'
// 			? {...base, isScreenTablet: true, isScreenSmallTablet: true}
// 			: {...base, isScreenTablet: true};
// 	}

// 	return {...base, isScreenDesktop: true};
// };

// const useScreenSize = (): ScreenMode => {
// 	const [windowDimensions, setWindowDimensions] = useState<ScreenMode>(
// 		getScreenByMode('xl')
// 	);

// 	useEffect(() => {
// 		const mediaQueries = screenSizes.map(({name, size}) => ({
// 			mediaQueryList: window.matchMedia(`(min-width: ${size}px)`),
// 			mode: name,
// 		}));

// 		const listener = (): void => {
// 			const nameScreen = screenSizes.find(
// 				(el) => document.body.clientWidth >= el.size
// 			);
// 			const screenSize = nameScreen?.name || 'xl';
// 			setWindowDimensions(getScreenByMode(screenSize));
// 		};

// 		listener();

// 		mediaQueries.forEach(({mediaQueryList}) => {
// 			if (mediaQueryList.addListener) {
// 				mediaQueryList.addListener(listener);
// 			} else {
// 				mediaQueryList.addEventListener('change', listener);
// 			}
// 		});

// 		return () => {
// 			return mediaQueries.forEach(({mediaQueryList}) => {
// 				if (mediaQueryList.removeListener) {
// 					mediaQueryList.removeListener(listener);
// 				} else {
// 					mediaQueryList.removeEventListener('change', listener);
// 				}
// 			});
// 		};
// 	}, []);

// 	return windowDimensions;
// };

// export default useScreenSize;

import {useEffect, useState, useCallback} from 'react';
import {screenSizes} from '@/utils/values/screenSizes';
import {ScreenMode, ScreenSizeCode} from '@/typings/screen';

const getScreenByMode = (mode: ScreenSizeCode): ScreenMode => {
	const base = {
		isScreenMobile: false,
		isScreenSmallTablet: false,
		isScreenTablet: false,
		isScreenDesktop: false,
	} as const;

	switch (mode) {
		case 'xs':
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

const useScreenSize = (): ScreenMode => {
	const [windowDimensions, setWindowDimensions] = useState<ScreenMode>(
		getScreenByMode('xl')
	);

	const listener = useCallback(() => {
		const nameScreen = screenSizes.find(
			(el) => window.innerWidth >= el.size
		);
		const screenSize = nameScreen?.name || 'xl';
		setWindowDimensions(getScreenByMode(screenSize));
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
