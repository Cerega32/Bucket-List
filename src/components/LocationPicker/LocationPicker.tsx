import 'maplibre-gl/dist/maplibre-gl.css';
import React, {useCallback, useState} from 'react';
import {GeolocateControl, Map as MapLibreMap, MapProvider, Marker, NavigationControl} from 'react-map-gl/maplibre';

import {Button} from '@/components/Button/Button';
import {FieldInput} from '@/components/FieldInput/FieldInput';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {Location} from '@/utils/mapApi';
import './LocationPicker.scss';

// OpenStreetMap стиль - полностью бесплатный
const MAP_STYLE = {
	version: 8 as const,
	sources: {
		'osm-tiles': {
			type: 'raster' as const,
			tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
			tileSize: 256,
			attribution: '© OpenStreetMap contributors',
		},
	},
	layers: [
		{
			id: 'osm-tiles',
			type: 'raster' as const,
			source: 'osm-tiles',
		},
	],
};

interface LocationPickerProps {
	onLocationSelect: (location: Partial<Location>) => void;
	onClose: () => void;
	initialLocation?: Partial<Location>;
}

interface SelectedPoint {
	longitude: number;
	latitude: number;
	name?: string;
	country?: string;
	city?: string;
	description?: string;
}

interface NominatimResult {
	place_id: number;
	display_name: string;
	name: string;
	lat: string;
	lon: string;
	address: {
		country?: string;
		city?: string;
		town?: string;
		village?: string;
		state?: string;
	};
}

const LocationPicker: React.FC<LocationPickerProps> = ({onLocationSelect, onClose, initialLocation}) => {
	const [, element] = useBem('location-picker');

	const [viewState, setViewState] = useState({
		longitude: initialLocation?.longitude || 37.6176,
		latitude: initialLocation?.latitude || 55.7558,
		zoom: initialLocation ? 12 : 2,
	});

	const [selectedLocation, setSelectedLocation] = useState<SelectedPoint | null>(
		initialLocation
			? {
					longitude: initialLocation.longitude!,
					latitude: initialLocation.latitude!,
					name: initialLocation.name,
					country: initialLocation.country,
					city: initialLocation.city,
					description: initialLocation.description,
			  }
			: null
	);

	const [searchQuery, setSearchQuery] = useState('');
	const [isSearching, setIsSearching] = useState(false);
	const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);

	// Поиск места через Nominatim API (OpenStreetMap)
	const searchPlace = async (query: string) => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?${new URLSearchParams({
					q: query,
					format: 'json',
					limit: '5',
					addressdetails: '1',
					'accept-language': 'ru,en',
				})}`
			);
			const data: NominatimResult[] = await response.json();
			setSearchResults(data || []);
		} catch (error) {
			console.error('Error searching places:', error);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	// Debounced поиск
	const debouncedSearch = useCallback((query: string) => {
		const timer = setTimeout(() => searchPlace(query), 300);
		return () => clearTimeout(timer);
	}, []);

	// Обратное геокодирование для получения информации о месте
	const reverseGeocode = async (lng: number, lat: number) => {
		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({
					lat: lat.toString(),
					lon: lng.toString(),
					format: 'json',
					addressdetails: '1',
					'accept-language': 'ru,en',
				})}`
			);
			const data: NominatimResult = await response.json();

			if (data && data.display_name) {
				const country = data.address?.country || 'Неизвестная страна';
				const city = data.address?.city || data.address?.town || data.address?.village || '';

				setSelectedLocation((prev) => ({
					...prev!,
					name: data.name || data.display_name.split(',')[0],
					country,
					city,
				}));
			}
		} catch (error) {
			console.error('Error reverse geocoding:', error);
		}
	};

	// Обработчик клика по карте
	const onMapClick = useCallback((event: any) => {
		const {lng, lat} = event.lngLat;
		setSelectedLocation({
			longitude: lng,
			latitude: lat,
			name: `Точка ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
		});

		// Получаем информацию о месте через обратное геокодирование
		reverseGeocode(lng, lat);
	}, []);

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		debouncedSearch(value);
	};

	// Обработчик выбора места из результатов поиска
	const handleSearchResultSelect = (result: NominatimResult) => {
		const lng = parseFloat(result.lon);
		const lat = parseFloat(result.lat);
		const country = result.address?.country || 'Неизвестная страна';
		const city = result.address?.city || result.address?.town || result.address?.village || '';

		setSelectedLocation({
			longitude: lng,
			latitude: lat,
			name: result.name || result.display_name.split(',')[0],
			country,
			city,
		});

		setViewState({
			longitude: lng,
			latitude: lat,
			zoom: 12,
		});

		setSearchResults([]);
		setSearchQuery('');
	};

	// Обработчик сохранения выбранного места
	const handleSave = () => {
		if (!selectedLocation) return;

		const location: Partial<Location> = {
			name: selectedLocation.name || `Точка ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`,
			longitude: selectedLocation.longitude,
			latitude: selectedLocation.latitude,
			country: selectedLocation.country || 'Неизвестная страна',
			city: selectedLocation.city,
			description: selectedLocation.description,
		};

		onLocationSelect(location);
	};

	const handleMove = useCallback((evt: any) => {
		setViewState(evt.viewState);
	}, []);

	return (
		<div className="location-picker-overlay">
			<div className="location-picker">
				<div className="location-picker__header">
					<h3>Выберите место на карте</h3>
					<button type="button" className="location-picker__close" onClick={onClose} aria-label="Закрыть">
						<Svg icon="cross" />
					</button>
				</div>

				<div className="location-picker__search">
					<FieldInput
						placeholder="Поиск места..."
						id="location-search"
						text=""
						value={searchQuery}
						setValue={handleSearchChange}
						className={element('search-input')}
					/>
					{isSearching && (
						<div className="location-picker__search-loading">
							<Svg icon="loading" className="loading-icon" />
						</div>
					)}

					{searchResults.length > 0 && (
						<div className="location-picker__search-results">
							{searchResults.map((result) => (
								<button
									key={result.place_id}
									type="button"
									className="location-picker__search-result"
									onClick={() => handleSearchResultSelect(result)}
								>
									<div className="result-name">{result.name || result.display_name.split(',')[0]}</div>
									<div className="result-place">{result.display_name}</div>
								</button>
							))}
						</div>
					)}
				</div>

				<div className="location-picker__map">
					<MapProvider>
						<MapLibreMap
							{...viewState}
							mapStyle={MAP_STYLE}
							onMove={handleMove}
							onClick={onMapClick}
							style={{width: '100%', height: '400px'}}
						>
							<NavigationControl position="top-right" />
							<GeolocateControl position="top-right" />

							{selectedLocation && (
								<Marker longitude={selectedLocation.longitude} latitude={selectedLocation.latitude} anchor="bottom">
									<div className="location-picker__marker">
										<div className="marker-icon">📍</div>
									</div>
								</Marker>
							)}
						</MapLibreMap>
					</MapProvider>
				</div>

				{selectedLocation && (
					<div className="location-picker__selected">
						<h4>Выбранное место:</h4>
						<div className="location-picker__details">
							<FieldInput
								text="Название места"
								placeholder="Введите название"
								id="location-name"
								value={selectedLocation.name || ''}
								setValue={(value) => setSelectedLocation((prev) => ({...prev!, name: value}))}
							/>
							<FieldInput
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
							/>
							<FieldInput
								text="Описание"
								placeholder="Краткое описание места"
								id="location-description"
								value={selectedLocation.description || ''}
								setValue={(value) => setSelectedLocation((prev) => ({...prev!, description: value}))}
								type="textarea"
							/>
							<div className="coordinates">
								<span>
									Координаты: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
								</span>
							</div>
						</div>
					</div>
				)}

				<div className="location-picker__actions">
					<Button theme="blue-light" onClick={onClose}>
						Отмена
					</Button>
					<Button theme="blue" onClick={handleSave}>
						Выбрать место
					</Button>
				</div>
			</div>
		</div>
	);
};

export default LocationPicker;
