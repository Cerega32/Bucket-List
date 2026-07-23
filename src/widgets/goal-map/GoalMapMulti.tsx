import {FC, useEffect, useRef, useState} from 'react';

import {GoalWithLocation} from '@/entities/goal/api/mapApi';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Banner} from '@/shared/ui/Banner/Banner';
import {
	loadYandexMapsScript,
	YANDEX_MAP_LOAD_ERROR_MESSAGE,
	YANDEX_MAPS_LOAD_TIMEOUT_MS,
} from '@/widgets/goal-map/lib/loadYandexMapsScript';
import {
	getYandexBalloonPanelMaxMapArea,
	scrollMapBottomIntoViewport,
	subscribeYandexBalloonPanelMode,
	YANDEX_MARKER_PRESET_ACTIVE,
	YANDEX_MARKER_PRESET_UNVISITED,
	YANDEX_MARKER_PRESET_VISITED,
} from '@/widgets/goal-map/lib/yandexMapBalloon';
import '@/widgets/goal-map/goal-map.scss';

export interface GoalMapMultiProps {
	className?: string;
	goals: GoalWithLocation[];
	/** Индекс маркера, у которого открыть балун после загрузки карты */
	openBalloonAt?: number;
	/** Пересчитать размер карты при появлении (например, после смены слайда) */
	isVisible?: boolean;
	onLoadError?: () => void;
	onLoadSuccess?: () => void;
}

export const GoalMapMulti: FC<GoalMapMultiProps> = (props) => {
	const {className, goals, openBalloonAt, isVisible = true, onLoadError, onLoadSuccess} = props;
	const [block, element] = useBem('goal-map', className);
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<any>(null);
	const markersRef = useRef<any[]>([]);
	const activeMarkerRef = useRef<any>(null);
	const [mapLoadError, setMapLoadError] = useState(false);
	const [mapReady, setMapReady] = useState(false);

	const fitMapToContainer = () => {
		mapInstance.current?.container?.fitToViewport?.();
	};

	const getBasePreset = (visited: boolean) => (visited ? YANDEX_MARKER_PRESET_VISITED : YANDEX_MARKER_PRESET_UNVISITED);

	const setActiveMarker = (marker: any | null) => {
		if (activeMarkerRef.current && activeMarkerRef.current !== marker) {
			const previous = activeMarkerRef.current;
			previous.options.set('preset', previous.properties.get('basePreset') || YANDEX_MARKER_PRESET_UNVISITED);
		}
		activeMarkerRef.current = marker;
		if (marker) {
			marker.options.set('preset', YANDEX_MARKER_PRESET_ACTIVE);
		}
	};

	useEffect(() => {
		if (!isVisible || !mapReady) {
			return undefined;
		}

		fitMapToContainer();
		const frameId = window.requestAnimationFrame(fitMapToContainer);
		return () => window.cancelAnimationFrame(frameId);
	}, [isVisible, mapReady]);

	useEffect(() => {
		const validGoals = goals.filter(
			(g) => g.location && typeof g.location.latitude === 'number' && typeof g.location.longitude === 'number'
		);
		if (!validGoals.length) return;

		let cancelled = false;
		let loadTimeoutId: number | undefined;
		let resizeObserver: ResizeObserver | undefined;
		let unsubscribeBalloonMode: (() => void) | undefined;

		const reportError = () => {
			if (!cancelled) {
				setMapLoadError(true);
				onLoadError?.();
			}
		};

		const reportSuccess = () => {
			if (cancelled) {
				return;
			}
			if (loadTimeoutId) {
				clearTimeout(loadTimeoutId);
				loadTimeoutId = undefined;
			}
			setMapLoadError(false);
			onLoadSuccess?.();
		};

		const scheduleLoadTimeout = () => {
			loadTimeoutId = window.setTimeout(() => {
				if (!mapInstance.current) {
					reportError();
				}
			}, YANDEX_MAPS_LOAD_TIMEOUT_MS);
		};

		const initMap = () => {
			try {
				if (!mapContainer.current || mapInstance.current || !window.ymaps) {
					if (!window.ymaps) {
						reportError();
					}
					return;
				}

				const avgLat = validGoals.reduce((sum, g) => sum + g.location.latitude, 0) / validGoals.length;
				const avgLon = validGoals.reduce((sum, g) => sum + g.location.longitude, 0) / validGoals.length;

				const map = new window.ymaps.Map(
					mapContainer.current,
					{
						center: [avgLat, avgLon],
						zoom: 4,
						controls: ['zoomControl', 'typeSelector'],
					},
					{
						balloonPanelMaxMapArea: getYandexBalloonPanelMaxMapArea(),
					}
				);

				mapInstance.current = map;
				markersRef.current = [];
				activeMarkerRef.current = null;

				const points: number[][] = [];

				validGoals.forEach((goal) => {
					const {location, userVisitedLocation, name, address, description} = goal;
					const basePreset = getBasePreset(!!userVisitedLocation);
					const marker = new window.ymaps.Placemark(
						[location.latitude, location.longitude],
						{
							balloonContentHeader: `<div class="goal-map__title">${name || 'Место назначения'}</div>`,
							balloonContentBody: `
              <div class="goal-map__content">
                ${address ? `<p class="goal-map__address">${address}</p>` : ''}
                ${description ? `<p class="goal-map__description">${description}</p>` : ''}
                <p class="goal-map__coordinates">
                  <span class="goal-map__coordinates-label">Координаты:</span>
                  <span class="goal-map__coordinates-value">${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</span>
                </p>
                <p class="goal-map__status">Статус: ${userVisitedLocation ? 'Посещено ✓' : 'Не посещено'}</p>
              </div>
            `,
							hintContent: name || 'Место назначения',
							basePreset,
						},
						{
							preset: basePreset,
							openBalloonOnHover: openBalloonAt === undefined,
							balloonCloseButton: true,
							hideIconOnBalloonOpen: false,
							balloonAutoPan: true,
							balloonAutoPanMargin: [48, 48, 48, 48],
						}
					);

					marker.events.add('balloonopen', () => {
						setActiveMarker(marker);
						scrollMapBottomIntoViewport(mapContainer.current);
					});
					marker.events.add('balloonclose', () => {
						if (activeMarkerRef.current === marker) {
							marker.options.set('preset', basePreset);
							activeMarkerRef.current = null;
						}
					});

					map.geoObjects.add(marker);
					markersRef.current.push(marker);
					points.push([location.latitude, location.longitude]);
				});

				if (points.length > 1) {
					map.setBounds(window.ymaps.util.bounds.fromPoints(points), {checkZoomRange: true, zoomMargin: 64});
				} else {
					map.setCenter([validGoals[0].location.latitude, validGoals[0].location.longitude], 13);
				}

				if (openBalloonAt !== undefined && markersRef.current[openBalloonAt]) {
					window.setTimeout(() => {
						const marker = markersRef.current[openBalloonAt];
						if (!marker) return;
						setActiveMarker(marker);
						marker.balloon.open();
					}, 500);
				}

				if (mapContainer.current) {
					resizeObserver = new ResizeObserver(() => {
						fitMapToContainer();
					});
					resizeObserver.observe(mapContainer.current);
				}

				unsubscribeBalloonMode = subscribeYandexBalloonPanelMode(map, () => {
					const marker = activeMarkerRef.current;
					if (!marker?.balloon?.isOpen?.()) {
						return;
					}
					marker.balloon.close();
					window.setTimeout(() => {
						setActiveMarker(marker);
						marker.balloon.open();
					}, 0);
				});

				window.requestAnimationFrame(fitMapToContainer);
				setMapReady(true);
				reportSuccess();
			} catch {
				reportError();
			}
		};

		const startMapLoad = () => {
			scheduleLoadTimeout();
			loadYandexMapsScript()
				.then(initMap)
				.catch(() => {
					reportError();
				});
		};

		startMapLoad();

		return () => {
			cancelled = true;
			setMapReady(false);
			unsubscribeBalloonMode?.();
			resizeObserver?.disconnect();
			if (loadTimeoutId) {
				clearTimeout(loadTimeoutId);
			}
			if (mapInstance.current) {
				mapInstance.current.destroy();
				mapInstance.current = null;
			}
			markersRef.current = [];
			activeMarkerRef.current = null;
		};
	}, [goals, openBalloonAt, onLoadError, onLoadSuccess]);

	const showInlineBanner = mapLoadError && !onLoadError;

	return (
		<div className={block()}>
			{showInlineBanner && <Banner type="warning" className={element('load-banner')} message={YANDEX_MAP_LOAD_ERROR_MESSAGE} />}
			<div ref={mapContainer} className={element('container')} />
		</div>
	);
};
