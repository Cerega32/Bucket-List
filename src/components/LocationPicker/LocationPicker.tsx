import React, {useEffect, useRef, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {useBem} from '@/hooks/useBem';
import {ILocation} from '@/typings/goal';

import {Title} from '../Title/Title';

import './LocationPicker.scss';

interface LocationPickerProps {
	onLocationSelect: (location: Partial<ILocation>) => void;
	initialLocation?: Partial<ILocation>;
	closeModal: () => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({onLocationSelect, initialLocation, closeModal}) => {
	const [block, element] = useBem('location-picker');
	const mapRef = useRef<HTMLDivElement>(null);
	const [selectedLocation, setSelectedLocation] = useState<Partial<ILocation> | null>(initialLocation || null);
	const markerRef = useRef<any>(null);
	const mapInstance = useRef<any>(null);

	// Инициализация карты с контролом поиска
	useEffect(() => {
		const initMap = () => {
			if (!mapRef.current || mapInstance.current) return;
			const center =
				initialLocation && initialLocation.latitude && initialLocation.longitude
					? [initialLocation.latitude, initialLocation.longitude]
					: [55.751244, 37.618423];
			const map = new window.ymaps.Map(mapRef.current, {
				center,
				zoom: initialLocation ? 12 : 2,
				controls: ['zoomControl', 'typeSelector'],
			});
			mapInstance.current = map;

			// Добавляем контрол поиска
			const searchControl = new window.ymaps.control.SearchControl({
				options: {
					provider: 'yandex#search',
					noPlacemark: true,
					results: 10,
					size: 'large',
					noSuggestPanel: true,
					suggestProvider: {
						provider: 'yandex#suggest',
						apikey: process.env['NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY'],
					},
				},
			});
			map.controls.add(searchControl);

			// Обработка выбора результата поиска
			searchControl.events.add('resultselect', (e: any) => {
				const index = e.get('index');
				searchControl.getResult(index).then((res: any) => {
					const coords = res.geometry.getCoordinates();
					if (markerRef.current) {
						markerRef.current.geometry.setCoordinates(coords);
					} else {
						markerRef.current = new window.ymaps.Placemark(coords, {}, {preset: 'islands#redDotIcon'});
						map.geoObjects.add(markerRef.current);
					}
					// Делаем обратное геокодирование для получения города и страны
					window.ymaps.geocode(coords).then((geoRes: any) => {
						const firstGeoObject = geoRes.geoObjects.get(0);
						setSelectedLocation({
							name: res.properties.get('name') || res.properties.get('text') || (res.getAddressLine && res.getAddressLine()),
							description: res.properties.get('description') || '',
							latitude: coords[0],
							longitude: coords[1],
							country: firstGeoObject.getCountry(),
							city: firstGeoObject.getLocalities()[0],
						});
					});
					map.setCenter(coords, 12);
				});
			});

			// Клик по карте (оставляем для ручного выбора)
			map.events.add('click', (e: any) => {
				const coords = e.get('coords');
				setSelectedLocation({
					latitude: coords[0],
					longitude: coords[1],
				});
				if (markerRef.current) {
					markerRef.current.geometry.setCoordinates(coords);
				} else {
					markerRef.current = new window.ymaps.Placemark(coords, {}, {preset: 'islands#redDotIcon'});
					map.geoObjects.add(markerRef.current);
				}
				// Обратное геокодирование для ручного выбора
				window.ymaps.geocode(coords).then((res: any) => {
					const firstGeoObject = res.geoObjects.get(0);
					setSelectedLocation((prev) => ({
						...prev!,
						name: firstGeoObject.getLocalities()[0] || firstGeoObject.getAddressLine(),
						country: firstGeoObject.getCountry(),
						city: firstGeoObject.getLocalities()[0],
					}));
				});
			});

			// Если есть начальная точка
			if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
				markerRef.current = new window.ymaps.Placemark(center, {}, {preset: 'islands#redDotIcon'});
				map.geoObjects.add(markerRef.current);
			}
		};

		const scriptSrc = `https://api-maps.yandex.ru/2.1/?apikey=${process.env['NEXT_PUBLIC_YANDEX_API_KEY']}&lang=ru_RU`;

		if (window.ymaps && window.ymaps.Map) {
			window.ymaps.ready(initMap);
		} else if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
			const script = document.createElement('script');
			script.src = scriptSrc;
			script.async = true;
			script.onload = () => window.ymaps.ready(initMap);
			document.head.appendChild(script);
		} else {
			const waitForYmaps = () => {
				if (window.ymaps && typeof window.ymaps.ready === 'function') {
					window.ymaps.ready(initMap);
				} else {
					setTimeout(waitForYmaps, 100);
				}
			};
			waitForYmaps();
		}

		return () => {
			if (mapInstance.current) {
				mapInstance.current.destroy();
				mapInstance.current = null;
			}
		};
	}, [initialLocation]);

	return (
		<div className={block()}>
			<Title tag="h2">Выберите место на карте</Title>

			<div className={element('map')}>
				<div ref={mapRef} style={{width: '100%', height: 450, borderRadius: 12}} />
			</div>

			{selectedLocation && (
				<div className={element('selected')}>
					<h4>Выбранное место:</h4>
					<div className={element('details')}>
						<FieldInput
							text="Название места"
							placeholder="Введите название"
							id="location-name"
							value={selectedLocation.name || ''}
							setValue={(value) => setSelectedLocation((prev) => ({...prev!, name: value}))}
						/>
						{/* <FieldInput
							text="Страна"
							placeholder="Введите страну"
							id="location-country"
							value={selectedLocation.country || ''}
							setValue={(value) => setSelectedLocation((prev) => ({...prev!, country: value}))}
						/>
						<FieldInput
							text="Город"
							placeholder="Введите город"
							id="location-city"
							value={selectedLocation.city || ''}
							setValue={(value) => setSelectedLocation((prev) => ({...prev!, city: value}))}
						/> */}
						<FieldInput
							text="Описание"
							placeholder="Краткое описание места"
							id="location-description"
							value={selectedLocation.description || ''}
							setValue={(value) => setSelectedLocation((prev) => ({...prev!, description: value}))}
							type="textarea"
						/>
						<div className={element('coordinates')}>
							<span>
								Координаты: {selectedLocation.latitude?.toFixed(6)}, {selectedLocation.longitude?.toFixed(6)}
							</span>
						</div>
					</div>
				</div>
			)}

			<div className={element('actions')}>
				<Button theme="blue-light" onClick={closeModal}>
					Отмена
				</Button>
				<Button theme="blue" onClick={() => selectedLocation && onLocationSelect(selectedLocation)}>
					Выбрать место
				</Button>
			</div>
		</div>
	);
};

export default LocationPicker;
