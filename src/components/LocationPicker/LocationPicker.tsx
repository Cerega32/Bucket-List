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
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [selectedLocation, setSelectedLocation] = useState<Partial<ILocation> | null>(initialLocation || null);
	const markerRef = useRef<any>(null);
	const mapInstance = useRef<any>(null);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [activeResult, setActiveResult] = useState<number>(-1);

	// Инициализация карты
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

			// Клик по карте
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
				// Обратное геокодирование
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
			// Скрипт уже загружен, но ymaps еще не инициализирован
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

	// Поиск по Яндекс Геокодеру
	const handleSearch = async () => {
		if (!searchQuery.trim() || !window.ymaps) return;
		window.ymaps.geocode(searchQuery).then((res: any) => {
			const results: any[] = [];
			res.geoObjects.each((obj: any) => {
				const coords = obj.geometry.getCoordinates();
				results.push({
					name: obj.getAddressLine(),
					latitude: coords[0],
					longitude: coords[1],
				});
			});
			setSearchResults(results);
			setActiveResult(-1);
		});
	};

	// Выбор результата поиска
	const handleResultSelect = (result: any) => {
		setSelectedLocation(result);
		setSearchResults([]);
		setSearchQuery('');
		if (mapInstance.current) {
			mapInstance.current.setCenter([result.latitude, result.longitude], 12);
			if (markerRef.current) {
				markerRef.current.geometry.setCoordinates([result.latitude, result.longitude]);
			} else {
				markerRef.current = new window.ymaps.Placemark([result.latitude, result.longitude], {}, {preset: 'islands#redDotIcon'});
				mapInstance.current.geoObjects.add(markerRef.current);
			}
		}
	};

	// Обработка Enter и стрелок в поиске
	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (searchResults.length > 0 && activeResult >= 0) {
				handleResultSelect(searchResults[activeResult]);
			} else {
				handleSearch();
			}
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setActiveResult((prev) => Math.min(prev + 1, searchResults.length - 1));
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			setActiveResult((prev) => Math.max(prev - 1, 0));
		}
	};

	return (
		<div className={block()}>
			<Title tag="h2">Выберите место на карте</Title>

			<div className={element('search')}>
				<FieldInput
					placeholder="Поиск по Яндекс.Картам..."
					id="location-search"
					text=""
					value={searchQuery}
					setValue={setSearchQuery}
					onFocus={() => setIsSearchFocused(true)}
					onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
					onKeyDown={handleSearchKeyDown}
					className={element('search-input')}
				/>
				<Button theme="blue-light" onClick={handleSearch} size="medium">
					Поиск
				</Button>
				{isSearchFocused && searchResults.length > 0 && (
					<div className={element('search-results')} style={{transition: 'all 0.2s', boxShadow: '0 8px 32px rgb(0 0 0 / 15%)'}}>
						{searchResults.map((result, idx) => (
							<button
								key={`${result.latitude}-${result.longitude}`}
								type="button"
								className={element('search-result', {active: activeResult === idx})}
								onClick={() => handleResultSelect(result)}
								style={{
									background: activeResult === idx ? 'var(--color-gray-4)' : undefined,
									fontWeight: activeResult === idx ? 600 : undefined,
									borderLeft: activeResult === idx ? '3px solid var(--color-primary)' : undefined,
								}}
							>
								<div className={element('result-name')}>{result.name}</div>
								<div className={element('result-place')}>
									{result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
								</div>
							</button>
						))}
					</div>
				)}
			</div>

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
