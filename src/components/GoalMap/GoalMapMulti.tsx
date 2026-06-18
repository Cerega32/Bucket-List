import {FC, useEffect, useRef, useState} from 'react';

import {Banner} from '@/components/Banner/Banner';
import {useBem} from '@/hooks/useBem';
import {GoalWithLocation} from '@/utils/mapApi';
import {loadYandexMapsScript, YANDEX_MAP_LOAD_ERROR_MESSAGE, YANDEX_MAPS_LOAD_TIMEOUT_MS} from '@/utils/maps/loadYandexMapsScript';
import './goal-map.scss';

export interface GoalMapMultiProps {
	className?: string;
	goals: GoalWithLocation[];
	/** Индекс маркера, у которого открыть балун после загрузки карты */
	openBalloonAt?: number;
	onLoadError?: () => void;
	onLoadSuccess?: () => void;
}

export const GoalMapMulti: FC<GoalMapMultiProps> = (props) => {
	const {className, goals, openBalloonAt, onLoadError, onLoadSuccess} = props;
	const [block, element] = useBem('goal-map', className);
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<any>(null);
	const markersRef = useRef<any[]>([]);
	const [mapLoadError, setMapLoadError] = useState(false);

	useEffect(() => {
		const validGoals = goals.filter(
			(g) => g.location && typeof g.location.latitude === 'number' && typeof g.location.longitude === 'number'
		);
		if (!validGoals.length) return;

		let cancelled = false;
		let loadTimeoutId: number | undefined;

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

				const map = new window.ymaps.Map(mapContainer.current, {
					center: [avgLat, avgLon],
					zoom: 4,
					controls: ['zoomControl', 'typeSelector'],
				});

				mapInstance.current = map;
				markersRef.current = [];

				const points: number[][] = [];

				validGoals.forEach((goal) => {
					const {location, userVisitedLocation, name, address, description} = goal;
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
						},
						{
							preset: userVisitedLocation ? 'islands#greenDotIcon' : 'islands#redDotIcon',
							openBalloonOnHover: openBalloonAt === undefined,
							balloonCloseButton: true,
							hideIconOnBalloonOpen: false,
							balloonAutoPan: true,
							balloonAutoPanMargin: [48, 48, 48, 48],
						}
					);
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
					window.setTimeout(() => markersRef.current[openBalloonAt].balloon.open(), 500);
				}

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
			if (loadTimeoutId) {
				clearTimeout(loadTimeoutId);
			}
			if (mapInstance.current) {
				mapInstance.current.destroy();
				mapInstance.current = null;
			}
			markersRef.current = [];
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
