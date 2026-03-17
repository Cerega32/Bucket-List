import {useEffect, useState} from 'react';

const HARD_DISABLED_DELAY = 500;

type SwiperInstance = {
	isLocked: boolean;
	slides: {length: number};
	isBeginning: boolean;
	isEnd: boolean;
};

export function useSwiperNavigation() {
	const [canScroll, setCanScroll] = useState(false);
	const [isAtStart, setIsAtStart] = useState(true);
	const [isAtEnd, setIsAtEnd] = useState(false);
	const [isPrevHardDisabled, setIsPrevHardDisabled] = useState(false);
	const [isNextHardDisabled, setIsNextHardDisabled] = useState(false);

	const updateSwiperState = (swiper: SwiperInstance) => {
		const scrollable = !swiper.isLocked && swiper.slides.length > 1;
		setCanScroll(scrollable);
		setIsAtStart(swiper.isBeginning);
		setIsAtEnd(swiper.isEnd);
	};

	const isPrevDisabled = !canScroll || isAtStart;
	const isNextDisabled = !canScroll || isAtEnd;

	useEffect(() => {
		if (!isPrevDisabled) {
			setIsPrevHardDisabled(false);
			return;
		}
		const timer = setTimeout(() => setIsPrevHardDisabled(true), HARD_DISABLED_DELAY);
		return () => clearTimeout(timer);
	}, [isPrevDisabled]);

	useEffect(() => {
		if (!isNextDisabled) {
			setIsNextHardDisabled(false);
			return;
		}
		const timer = setTimeout(() => setIsNextHardDisabled(true), HARD_DISABLED_DELAY);
		return () => clearTimeout(timer);
	}, [isNextDisabled]);

	return {
		updateSwiperState,
		isPrevDisabled,
		isNextDisabled,
		isPrevHardDisabled,
		isNextHardDisabled,
	};
}
