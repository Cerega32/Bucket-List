import {motion, useAnimationControls} from 'framer-motion';
import {FC, ReactElement, useEffect, useRef, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import './vertical-slider.scss';

interface VerticalSliderProps {
	className?: string;
	slides: Array<ReactElement>;
	direction?: 'up' | 'down';
	speed?: number;
}

export const VerticalSlider: FC<VerticalSliderProps> = (props) => {
	const {className, slides, direction = 'up', speed = 3} = props;
	const controls = useAnimationControls();
	const containerRef = useRef<HTMLDivElement>(null);
	const sliderContainerRef = useRef<HTMLDivElement>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const [containerHeight, setContainerHeight] = useState(0);
	const [sliderContainerHeight, setSliderContainerHeight] = useState(0);
	const [visibleItems, setVisibleItems] = useState<ReactElement[]>(slides);
	const [imagesLoaded, setImagesLoaded] = useState(false);

	const [block, element] = useBem('vertical-slider', className);

	// Дублируем слайды для бесшовной прокрутки
	const loopedSlides = [...visibleItems, ...visibleItems];

	// Функция для обновления размеров
	const updateSizes = () => {
		if (containerRef.current) {
			setContainerHeight(containerRef.current.clientHeight);
		}
		if (sliderContainerRef.current) {
			setSliderContainerHeight(sliderContainerRef.current.clientHeight);
		}
	};

	// Наблюдение за изменениями размеров контейнера
	useEffect(() => {
		if (typeof ResizeObserver !== 'undefined') {
			resizeObserverRef.current = new ResizeObserver(updateSizes);

			if (containerRef.current) {
				resizeObserverRef.current.observe(containerRef.current);
			}
			if (sliderContainerRef.current) {
				resizeObserverRef.current.observe(sliderContainerRef.current);
			}
		}

		return () => {
			if (resizeObserverRef.current) {
				resizeObserverRef.current.disconnect();
			}
		};
	}, []);

	// Начальное определение размеров
	useEffect(() => {
		updateSizes();
	}, [containerRef.current?.clientHeight, sliderContainerRef.current?.clientHeight]);

	// Наблюдение за загрузкой изображений
	useEffect(() => {
		if (sliderContainerRef.current) {
			const images = sliderContainerRef.current.querySelectorAll('img');

			if (images.length === 0) {
				// Если изображений нет, считаем контент загруженным
				setImagesLoaded(true);
				return undefined;
			}

			let loadedCount = 0;
			const totalImages = images.length;

			const imageLoadHandler = () => {
				loadedCount++;
				if (loadedCount === totalImages) {
					setImagesLoaded(true);
					// После загрузки всех изображений обновляем размеры
					updateSizes();
				}
			};

			images.forEach((img) => {
				if (img.complete) {
					imageLoadHandler();
				} else {
					img.addEventListener('load', imageLoadHandler);
					img.addEventListener('error', imageLoadHandler); // Также обрабатываем ошибки загрузки
				}
			});

			// eslint-disable-next-line consistent-return
			return () => {
				images.forEach((img) => {
					img.removeEventListener('load', imageLoadHandler);
					img.removeEventListener('error', imageLoadHandler);
				});
			};
		}
		return undefined;
	}, [visibleItems]);

	useEffect(() => {
		setVisibleItems(slides);
	}, [slides]);

	// Анимация с эффектом смены направления при достижении конца
	useEffect(() => {
		if (containerHeight > 0 && sliderContainerHeight > 0 && imagesLoaded) {
			const moveDistance = sliderContainerHeight / 2; // Только оригинальные слайды

			let isCancelled = false;

			const animate = async () => {
				if (isCancelled) return;
				if (direction === 'down') {
					await controls.set({y: -moveDistance});
					await controls.start({
						y: 0,
						transition: {
							duration: speed,
							ease: 'linear',
						},
					});
				} else {
					await controls.set({y: 0});
					await controls.start({
						y: -moveDistance,
						transition: {
							duration: speed,
							ease: 'linear',
						},
					});
				}
				animate(); // рекурсивный вызов
			};

			animate();

			return () => {
				isCancelled = true;
				controls.stop();
			};
		}
		// обязательно вернуть undefined, чтобы не было ошибки useEffect
		return undefined;
	}, [controls, containerHeight, sliderContainerHeight, speed, slides, imagesLoaded, direction]);

	return (
		<div className={block()} ref={containerRef}>
			<div className={element('slider-container')}>
				<motion.div className={element('items-container')} animate={controls} ref={sliderContainerRef}>
					{loopedSlides.map((slide, index) => {
						const slideId = `slide-${index}-${Math.random().toString(36).substr(2, 9)}`;
						return (
							<div key={slideId} className={element('slide')}>
								{slide}
							</div>
						);
					})}
				</motion.div>
			</div>
		</div>
	);
};
