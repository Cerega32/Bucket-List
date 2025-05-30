import {FC, useEffect, useRef} from 'react';

import {GoalWithLocation} from '@/utils/mapApi';
import './goal-map.scss';

export interface GoalMapMultiProps {
	goals: GoalWithLocation[];
}

export const GoalMapMulti: FC<GoalMapMultiProps> = ({goals}) => {
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<any>(null);

	useEffect(() => {
		const validGoals = goals.filter(
			(g) => g.location && typeof g.location.latitude === 'number' && typeof g.location.longitude === 'number'
		);
		if (!validGoals.length) return;

		const initMap = () => {
			if (!mapContainer.current || mapInstance.current || !window.ymaps) return;

			const map = new window.ymaps.Map(mapContainer.current, {
				center: [validGoals[0].location.latitude, validGoals[0].location.longitude],
				zoom: 4,
				controls: ['zoomControl', 'typeSelector'],
			});

			mapInstance.current = map;

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
						openBalloonOnHover: true,
						balloonCloseButton: true,
						hideIconOnBalloonOpen: false,
					}
				);
				map.geoObjects.add(marker);
				points.push([location.latitude, location.longitude]);
			});

			if (points.length > 1) {
				map.setBounds(window.ymaps.util.bounds.fromPoints(points), {checkZoomRange: true, zoomMargin: 40});
			} else {
				map.setCenter([validGoals[0].location.latitude, validGoals[0].location.longitude], 13);
			}
		};

		if (window.ymaps && window.ymaps.Map) {
			window.ymaps.ready(initMap);
		} else {
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
		};
	}, [goals]);

	return (
		<div className="goal-map">
			<div ref={mapContainer} className="goal-map__container" />
		</div>
	);
};
