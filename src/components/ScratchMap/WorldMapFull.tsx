import React, {useCallback, useEffect, useRef, useState} from 'react';

import worldMapSvgRaw from '@/assets/world-map-full.svg?raw';
import {Country} from '@/utils/mapApi';

// Построить <svg>-элемент из сырой строки и вырезать любые исполняемые векторы
// (script-теги и on*-обработчики), даже если источник "свой" — defense-in-depth.
const buildSafeSvgElement = (svgText: string): SVGElement | null => {
	const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
	const root = parsed.documentElement;
	if (!root || root.tagName.toLowerCase() !== 'svg') {
		return null;
	}
	root.querySelectorAll('script').forEach((node) => node.remove());
	root.querySelectorAll('*').forEach((el) => {
		Array.from(el.attributes).forEach((attr) => {
			const name = attr.name.toLowerCase();
			if (name.startsWith('on')) {
				el.removeAttribute(attr.name);
				return;
			}
			// Литерал собран из частей, чтобы не триггерить no-script-url — нам нужно именно выловить такие URL.
			const jsScheme = `java${'script'}:`;
			if ((name === 'href' || name === 'xlink:href') && attr.value.trim().toLowerCase().startsWith(jsScheme)) {
				el.removeAttribute(attr.name);
			}
		});
	});
	return root as unknown as SVGElement;
};

interface WorldMapFullProps {
	countries: Country[];
	visitedCountries: number[];
	onCountryClick: (countryIsoCode: string) => void;
	onCountryHover?: (country: Country | null) => void;
}

const WorldMapFull: React.FC<WorldMapFullProps> = ({countries, visitedCountries, onCountryClick, onCountryHover}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [tooltip, setTooltip] = useState<{x: number; y: number; country: Country} | null>(null);
	const [mapLoaded, setMapLoaded] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Безопасный поиск страны по ISO коду
	const getCountryById = useCallback(
		(isoCode: string): Country | undefined => {
			if (!isoCode || !countries || countries.length === 0) {
				return undefined;
			}

			try {
				return countries.find((country) => {
					if (!country || !country.iso_code) return false;
					return country.iso_code.toLowerCase() === isoCode.toLowerCase();
				});
			} catch (findError) {
				// eslint-disable-next-line no-console
				console.error('Error finding country:', findError);
				return undefined;
			}
		},
		[countries]
	);

	const isCountryVisited = useCallback(
		(isoCode: string): boolean => {
			try {
				const country = getCountryById(isoCode);
				return country ? visitedCountries.includes(country.id) : false;
			} catch (visitedError) {
				// eslint-disable-next-line no-console
				console.error('Error checking if country visited:', visitedError);
				return false;
			}
		},
		[getCountryById, visitedCountries]
	);

	// Инжект SVG карты (bundled Vite'ом) с санитизацией script/on* на случай,
	// если исходный файл когда-нибудь будет подменён или заменён на user-generated.
	useEffect(() => {
		if (!containerRef.current) return;

		setError(null);
		const svgElement = buildSafeSvgElement(worldMapSvgRaw);
		if (!svgElement) {
			setError('Не удалось загрузить карту мира');
			return;
		}

		containerRef.current.replaceChildren(svgElement);
		setMapLoaded(true);
	}, []);

	// Настройка обработчиков событий
	useEffect(() => {
		if (!mapLoaded || !containerRef.current) return;

		const svg = containerRef.current.querySelector('svg');
		if (!svg) return;

		const countryPaths = svg.querySelectorAll('path[id]');
		const handlers: Array<{
			element: Element;
			type: string;
			handler: (e: Event) => void;
		}> = [];

		countryPaths.forEach((path) => {
			try {
				const isoCode = path.getAttribute('id');
				if (!isoCode) return;

				const country = getCountryById(isoCode);

				if (country) {
					// Устанавливаем стили
					const pathElement = path as SVGPathElement;
					const isVisited = isCountryVisited(isoCode);

					pathElement.style.fill = isVisited ? country.color_hex : '#e5e5e5';
					pathElement.style.cursor = 'pointer';
					pathElement.style.transition = 'all 0.2s ease';
					pathElement.style.stroke = '#fff';
					pathElement.style.strokeWidth = '0.5';

					// Обработчики событий
					const handleClick = () => {
						try {
							onCountryClick(isoCode);
						} catch (clickError) {
							// eslint-disable-next-line no-console
							console.error('Error handling country click:', clickError);
						}
					};

					const handleMouseEnter = (e: Event) => {
						try {
							const mouseEvent = e as MouseEvent;
							pathElement.style.opacity = '0.8';
							pathElement.style.strokeWidth = '1.5';

							onCountryHover?.(country);

							const rect = svg.getBoundingClientRect();
							setTooltip({
								x: mouseEvent.clientX - rect.left,
								y: mouseEvent.clientY - rect.top,
								country,
							});
						} catch (enterError) {
							// eslint-disable-next-line no-console
							console.error('Error handling mouse enter:', enterError);
						}
					};

					const handleMouseLeave = () => {
						try {
							pathElement.style.opacity = '1';
							pathElement.style.strokeWidth = '0.5';

							onCountryHover?.(null);
							setTooltip(null);
						} catch (leaveError) {
							// eslint-disable-next-line no-console
							console.error('Error handling mouse leave:', leaveError);
						}
					};

					// Добавляем слушатели
					path.addEventListener('click', handleClick);
					path.addEventListener('mouseenter', handleMouseEnter);
					path.addEventListener('mouseleave', handleMouseLeave);

					handlers.push(
						{element: path, type: 'click', handler: handleClick},
						{element: path, type: 'mouseenter', handler: handleMouseEnter},
						{element: path, type: 'mouseleave', handler: handleMouseLeave}
					);
				} else {
					// Неизвестные страны
					const pathElement = path as SVGPathElement;
					pathElement.style.fill = '#f0f0f0';
					pathElement.style.cursor = 'default';
				}
			} catch (pathError) {
				// eslint-disable-next-line no-console
				console.error('Error processing country path:', pathError);
			}
		});

		// Cleanup
		return () => {
			handlers.forEach(({element, type, handler}) => {
				try {
					if (element && element.removeEventListener) {
						element.removeEventListener(type, handler);
					}
				} catch (removeError) {
					// eslint-disable-next-line no-console
					console.warn('Error removing event listener:', removeError);
				}
			});
		};
	}, [mapLoaded, getCountryById, isCountryVisited, onCountryClick, onCountryHover]);

	// Cleanup при размонтировании
	useEffect(() => {
		return () => {
			if (containerRef.current) {
				try {
					containerRef.current.innerHTML = '';
				} catch (unmountError) {
					// eslint-disable-next-line no-console
					console.warn('Error clearing container on unmount:', unmountError);
				}
			}
			setTooltip(null);
		};
	}, []);

	if (error && !mapLoaded) {
		return (
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: '#666',
					fontSize: '16px',
				}}
			>
				{error}
			</div>
		);
	}

	return (
		<div style={{position: 'relative', width: '100%', height: '100%'}}>
			<div
				ref={containerRef}
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{!mapLoaded && <div style={{color: '#666', fontSize: '16px'}}>Загрузка карты мира...</div>}
			</div>

			{tooltip && (
				<div
					style={{
						position: 'absolute',
						left: Math.min(tooltip.x + 10, window.innerWidth - 200),
						top: Math.max(tooltip.y - 30, 10),
						background: 'rgba(0, 0, 0, 0.8)',
						color: 'white',
						padding: '8px 12px',
						borderRadius: '4px',
						fontSize: '12px',
						whiteSpace: 'nowrap',
						pointerEvents: 'none',
						zIndex: 1000,
					}}
				>
					{tooltip.country.name}
				</div>
			)}
		</div>
	);
};

export default WorldMapFull;
