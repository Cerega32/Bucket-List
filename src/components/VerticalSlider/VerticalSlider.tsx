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
				return;
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
	}, [visibleItems]);

	useEffect(() => {
		setVisibleItems(slides);
	}, [slides]);

	// Анимация с эффектом смены направления при достижении конца
	useEffect(() => {
		if (containerHeight > 0 && sliderContainerHeight > 0) {
			const moveDistance = sliderContainerHeight - containerHeight; // Расстояние движения

			// Запускаем анимацию только если есть что анимировать
			if (moveDistance > 0) {
				const startAnimation = async () => {
					if (direction === 'down') {
						await controls.set({y: -moveDistance});
						await controls.start({
							y: [-moveDistance, 0, -moveDistance],
							transition: {
								duration: speed,
								ease: 'linear',
								repeat: Infinity,
								repeatType: 'mirror',
								times: [0, 0.5, 1],
							},
						});
					} else {
						await controls.start({
							y: [0, -moveDistance, 0],
							transition: {
								duration: speed,
								ease: 'linear',
								repeat: Infinity,
								repeatType: 'mirror',
								times: [0, 0.5, 1],
							},
						});
					}
				};

				startAnimation();
			}
		}
	}, [controls, containerHeight, sliderContainerHeight, direction, speed, slides, imagesLoaded]);

	return (
		<div className={block()} ref={containerRef}>
			<div className={element('gradient-top')} />
			<div className={element('slider-container')}>
				<motion.div className={element('items-container')} animate={controls} ref={sliderContainerRef}>
					{visibleItems.map((slide, index) => {
						// Создаем уникальный идентификатор для каждого элемента на основе его содержимого
						// Это помогает избежать использования индекса в качестве ключа
						const slideId = `slide-${index}-${Math.random().toString(36).substr(2, 9)}`;

						return (
							<div key={slideId} className={element('slide')}>
								{slide}
							</div>
						);
					})}
				</motion.div>
			</div>
			<div className={element('gradient-bottom')} />
		</div>
	);
};
