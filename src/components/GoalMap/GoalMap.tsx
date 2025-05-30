import {FC, useEffect, useRef} from 'react';

import {ILocation} from '@/typings/goal';
import './goal-map.scss';

declare global {
	interface Window {
		ymaps: any;
	}
}

interface GoalMapProps {
	location: ILocation;
	userVisitedLocation: boolean;
}

export const GoalMap: FC<GoalMapProps> = ({location, userVisitedLocation}) => {
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<any>(null);
	const markerRef = useRef<any>(null);

	// Функция инициализации карты
	const initMap = () => {
		if (!mapContainer.current || mapInstance.current || !window.ymaps) return;

		const map = new window.ymaps.Map(mapContainer.current, {
			center: [location.latitude, location.longitude],
			zoom: 13,
			controls: ['zoomControl', 'typeSelector'],
		});

		mapInstance.current = map;

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
			},
			{
				preset: userVisitedLocation ? 'islands#greenDotIcon' : 'islands#redDotIcon',
				openBalloonOnHover: true,
				balloonCloseButton: true,
				hideIconOnBalloonOpen: false,
			}
		);

		map.geoObjects.add(marker);
		markerRef.current = marker;
	};

	useEffect(() => {
		// Проверяем, есть ли уже ymaps
		if (window.ymaps && window.ymaps.Map) {
			window.ymaps.ready(initMap);
		} else {
			// Если нет, добавляем скрипт только один раз
			const existingScript = document.querySelector('script[src^="https://api-maps.yandex.ru/2.1/"]');
			if (!existingScript) {
				const script = document.createElement('script');
				script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env['NEXT_PUBLIC_YANDEX_API_KEY']}&lang=ru_RU`;
				script.async = true;
				script.onload = () => window.ymaps.ready(initMap);
				document.head.appendChild(script);
			} else {
				existingScript.addEventListener('load', () => window.ymaps.ready(initMap));
			}
		}

		return () => {
			if (mapInstance.current) {
				mapInstance.current.destroy();
				mapInstance.current = null;
			}
			// Не удаляем скрипт из head!
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
		});
		markerRef.current.options.set('preset', userVisitedLocation ? 'islands#greenDotIcon' : 'islands#redDotIcon');
		mapInstance.current.setCenter([location.latitude, location.longitude]);
	}, [location, userVisitedLocation]);

	return (
		<div className="goal-map">
			<div ref={mapContainer} className="goal-map__container" />
		</div>
	);
};
