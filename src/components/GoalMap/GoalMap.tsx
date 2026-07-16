import {FC, useEffect, useRef, useState} from 'react';

import {Banner} from '@/components/Banner/Banner';
import {useBem} from '@/hooks/useBem';
import {ILocation} from '@/typings/goal';
import {loadYandexMapsScript, YANDEX_MAP_LOAD_ERROR_MESSAGE, YANDEX_MAPS_LOAD_TIMEOUT_MS} from '@/utils/maps/loadYandexMapsScript';
import {
	getYandexBalloonPanelMaxMapArea,
	scrollMapBottomIntoViewport,
	subscribeYandexBalloonPanelMode,
	YANDEX_MARKER_PRESET_ACTIVE,
	YANDEX_MARKER_PRESET_UNVISITED,
	YANDEX_MARKER_PRESET_VISITED,
} from '@/utils/maps/yandexMapBalloon';
import './goal-map.scss';

interface GoalMapProps {
	location: ILocation;
	userVisitedLocation: boolean;
	onLoadError?: () => void;
	onLoadSuccess?: () => void;
}

export const GoalMap: FC<GoalMapProps> = (props) => {
	const {location, userVisitedLocation, onLoadError, onLoadSuccess} = props;
	const [block, element] = useBem('goal-map');
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<any>(null);
	const markerRef = useRef<any>(null);
	const [mapLoadError, setMapLoadError] = useState(false);

	const getBasePreset = (visited: boolean) => (visited ? YANDEX_MARKER_PRESET_VISITED : YANDEX_MARKER_PRESET_UNVISITED);

	const initMap = () => {
		if (!mapContainer.current || mapInstance.current || !window.ymaps) return;

		const map = new window.ymaps.Map(
			mapContainer.current,
			{
				center: [location.latitude, location.longitude],
				zoom: 13,
				controls: ['zoomControl', 'typeSelector'],
			},
			{
				balloonPanelMaxMapArea: getYandexBalloonPanelMaxMapArea(),
			}
		);

		mapInstance.current = map;

		const basePreset = getBasePreset(userVisitedLocation);
		const marker = new window.ymaps.Placemark(
			[location.latitude, location.longitude],
			{
				balloonContentHeader: `<div class="goal-map__title">${location.name || 'Место назначения'}</div>`,
				balloonContentBody: `
					<div class="goal-map__content">
						${location.address ? `<p class="goal-map__address">${location.address}</p>` : ''}
						${location.description ? `<p class="goal-map__description">${location.description}</p>` : ''}
						<p class="goal-map__coordinates">
							<span class="goal-map__coordinates-label">Координаты:</span>
							<span class="goal-map__coordinates-value">${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</span>
						</p>
						<p class="goal-map__status">Статус: ${userVisitedLocation ? 'Посещено ✓' : 'Не посещено'}</p>
					</div>
				`,
				hintContent: location.name || 'Место назначения',
				basePreset,
			},
			{
				preset: basePreset,
				openBalloonOnHover: true,
				balloonCloseButton: true,
				hideIconOnBalloonOpen: false,
			}
		);

		marker.events.add('balloonopen', () => {
			marker.options.set('preset', YANDEX_MARKER_PRESET_ACTIVE);
			scrollMapBottomIntoViewport(mapContainer.current);
		});
		marker.events.add('balloonclose', () => {
			marker.options.set('preset', marker.properties.get('basePreset') || basePreset);
		});

		map.geoObjects.add(marker);
		markerRef.current = marker;
	};

	useEffect(() => {
		let cancelled = false;
		let loadTimeoutId: number | undefined;
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

		loadTimeoutId = window.setTimeout(() => {
			if (!mapInstance.current) {
				reportError();
			}
		}, YANDEX_MAPS_LOAD_TIMEOUT_MS);

		loadYandexMapsScript()
			.then(() => {
				if (cancelled) {
					return;
				}
				try {
					initMap();
					if (mapInstance.current) {
						unsubscribeBalloonMode = subscribeYandexBalloonPanelMode(mapInstance.current, () => {
							const marker = markerRef.current;
							if (!marker?.balloon?.isOpen?.()) {
								return;
							}
							marker.balloon.close();
							window.setTimeout(() => {
								marker.balloon.open();
							}, 0);
						});
						reportSuccess();
					}
				} catch {
					reportError();
				}
			})
			.catch(() => {
				reportError();
			});

		return () => {
			cancelled = true;
			unsubscribeBalloonMode?.();
			if (loadTimeoutId) {
				clearTimeout(loadTimeoutId);
			}
			if (mapInstance.current) {
				mapInstance.current.destroy();
				mapInstance.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!mapInstance.current || !markerRef.current) return;

		markerRef.current.geometry.setCoordinates([location.latitude, location.longitude]);
		markerRef.current.properties.set({
			balloonContentHeader: `<div class="goal-map__title">${location.name || 'Место назначения'}</div>`,
			balloonContentBody: `
				<div class="goal-map__content">
					${location.address ? `<p class="goal-map__address">${location.address}</p>` : ''}
					${location.description ? `<p class="goal-map__description">${location.description}</p>` : ''}
					<p class="goal-map__coordinates">
						<span class="goal-map__coordinates-label">Координаты:</span>
						<span class="goal-map__coordinates-value">${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</span>
					</p>
					<p class="goal-map__status">Статус: ${userVisitedLocation ? 'Посещено ✓' : 'Не посещено'}</p>
				</div>
			`,
			hintContent: location.name || 'Место назначения',
			basePreset: userVisitedLocation ? YANDEX_MARKER_PRESET_VISITED : YANDEX_MARKER_PRESET_UNVISITED,
		});
		const isBalloonOpen = markerRef.current.balloon?.isOpen?.();
		markerRef.current.options.set(
			'preset',
			isBalloonOpen
				? YANDEX_MARKER_PRESET_ACTIVE
				: userVisitedLocation
				? YANDEX_MARKER_PRESET_VISITED
				: YANDEX_MARKER_PRESET_UNVISITED
		);
		mapInstance.current.setCenter([location.latitude, location.longitude]);
	}, [location, userVisitedLocation]);

	const showInlineBanner = mapLoadError && !onLoadError;

	return (
		<div className={block()}>
			{showInlineBanner && <Banner type="warning" className={element('load-banner')} message={YANDEX_MAP_LOAD_ERROR_MESSAGE} />}
			<div ref={mapContainer} className={element('container')} />
		</div>
	);
};
