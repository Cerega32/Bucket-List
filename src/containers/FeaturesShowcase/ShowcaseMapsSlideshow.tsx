import {FC, useEffect, useRef, useState} from 'react';

import {CountriesScratchMap} from '@/components/CountriesScratchMap/CountriesScratchMap';
import {GoalMapMulti} from '@/components/GoalMap/GoalMapMulti';
import {useBem} from '@/hooks/useBem';

import {DEMO_SCRATCH_MAP_COUNTRIES, DEMO_WORLD_MAP_GOALS} from './features-showcase-data';

import './showcase-maps-slideshow.scss';

const AUTO_INTERVAL_MS = 7000;

const MAP_SLIDES = [
	{
		id: 'points',
		label: 'Точки на карте',
		hint: 'Места из целей с геолокацией — посещённые и запланированные',
	},
	{
		id: 'scratch',
		label: 'Скретч-карта',
		hint: 'Закрашивай страны и регионы по мере выполнения целей из списка',
	},
] as const;

interface ShowcaseMapsSlideshowProps {
	className?: string;
}

export const ShowcaseMapsSlideshow: FC<ShowcaseMapsSlideshowProps> = (props) => {
	const {className} = props;
	const [block, element] = useBem('showcase-maps-slideshow', className);
	const [activeSlide, setActiveSlide] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const isHoveredRef = useRef(false);
	const isFocusedRef = useRef(false);

	const updatePaused = () => {
		setIsPaused(isHoveredRef.current || isFocusedRef.current);
	};

	useEffect(() => {
		if (isPaused) {
			return undefined;
		}

		const timer = setInterval(() => {
			setActiveSlide((prev) => (prev + 1) % MAP_SLIDES.length);
		}, AUTO_INTERVAL_MS);

		return () => clearInterval(timer);
	}, [isPaused, activeSlide]);

	const handleFocusIn = () => {
		isFocusedRef.current = true;
		updatePaused();
	};

	const handleFocusOut = (event: React.FocusEvent<HTMLDivElement>) => {
		const nextTarget = event.relatedTarget as Node | null;
		if (nextTarget && containerRef.current?.contains(nextTarget)) {
			return;
		}
		isFocusedRef.current = false;
		updatePaused();
	};

	const activeMeta = MAP_SLIDES[activeSlide];

	return (
		<div
			ref={containerRef}
			className={block()}
			onMouseEnter={() => {
				isHoveredRef.current = true;
				updatePaused();
			}}
			onMouseLeave={() => {
				isHoveredRef.current = false;
				updatePaused();
			}}
			onFocusCapture={handleFocusIn}
			onBlurCapture={handleFocusOut}
		>
			<div className={element('header')}>
				<p className={element('label')}>{activeMeta.label}</p>
				<p className={element('hint')}>{activeMeta.hint}</p>
			</div>

			<div className={element('viewport')}>
				{MAP_SLIDES.map((slide, index) => (
					<div key={slide.id} className={element('slide', {active: index === activeSlide})} aria-hidden={index !== activeSlide}>
						{slide.id === 'points' ? (
							<GoalMapMulti
								className={element('map')}
								goals={DEMO_WORLD_MAP_GOALS}
								openBalloonAt={0}
								isVisible={index === activeSlide}
							/>
						) : (
							<CountriesScratchMap className={element('scratch-map')} showcaseCountries={DEMO_SCRATCH_MAP_COUNTRIES} />
						)}
					</div>
				))}
			</div>

			<div className={element('dots')} role="tablist" aria-label="Переключение карт">
				{MAP_SLIDES.map((slide, index) => (
					<button
						key={slide.id}
						type="button"
						role="tab"
						aria-selected={index === activeSlide}
						aria-label={slide.label}
						className={element('dot', {active: index === activeSlide})}
						onClick={() => setActiveSlide(index)}
					/>
				))}
			</div>
		</div>
	);
};
