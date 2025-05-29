import 'maplibre-gl/dist/maplibre-gl.css';
import React, {useCallback, useState} from 'react';
import {Map as MapLibreMap, MapProvider, Marker, NavigationControl, Popup} from 'react-map-gl/maplibre';

import {Goal, UserVisitedLocation} from '@/utils/mapApi';
import './Map.scss';

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

interface MapProps {
	goals: Goal[];
	visitedLocations: UserVisitedLocation[];
	onLocationVisit?: (locationId: number, goalId?: number) => void;
	onLocationUnvisit?: (locationId: number) => void;
	center?: [number, number];
	zoom?: number;
	height?: string;
}

const Map: React.FC<MapProps> = ({
	goals,
	visitedLocations,
	onLocationVisit,
	onLocationUnvisit,
	center = [37.6176, 55.7558], // Москва по умолчанию [lng, lat]
	zoom = 2,
	height = '400px',
}) => {
	const [loading, setLoading] = useState(false);
	const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
	const [viewState, setViewState] = useState({
		longitude: center[0],
		latitude: center[1],
		zoom,
	});

	const handleLocationVisit = async (locationId: number, goalId?: number) => {
		if (!onLocationVisit) return;

		setLoading(true);
		try {
			await onLocationVisit(locationId, goalId);
		} catch (error) {
			console.error('Error marking location as visited:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleLocationUnvisit = async (locationId: number) => {
		if (!onLocationUnvisit) return;

		setLoading(true);
		try {
			await onLocationUnvisit(locationId);
		} catch (error) {
			console.error('Error unmarking location as visited:', error);
		} finally {
			setLoading(false);
		}
	};

	const isLocationVisited = (locationId: number) => {
		return visitedLocations.some((vl) => vl.location.id === locationId);
	};

	const onMapClick = useCallback(() => {
		// Закрываем попап при клике на карту
		setSelectedGoal(null);
	}, []);

	const handleMove = useCallback((evt: any) => {
		setViewState(evt.viewState);
	}, []);

	return (
		<div className="map-container" style={{height}}>
			<MapProvider>
				<MapLibreMap
					{...viewState}
					mapStyle={MAP_STYLE}
					onMove={handleMove}
					onClick={onMapClick}
					style={{width: '100%', height: '100%'}}
				>
					<NavigationControl position="top-right" />

					{goals.map((goal) => {
						if (!goal.location) return null;

						const visited = isLocationVisited(goal.location.id);
						const markerColor = visited ? '#28a745' : '#dc3545';

						return (
							<Marker
								key={`goal-${goal.id}`}
								longitude={goal.location.longitude}
								latitude={goal.location.latitude}
								anchor="bottom"
							>
								<button
									type="button"
									className={`map-marker ${visited ? 'visited' : 'unvisited'}`}
									onClick={(e) => {
										e.stopPropagation();
										setSelectedGoal(goal);
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											setSelectedGoal(goal);
										}
									}}
									style={{backgroundColor: markerColor}}
									aria-label={`Место: ${goal.location.name}, цель: ${goal.title}`}
								>
									<div className="marker-icon">📍</div>
								</button>
							</Marker>
						);
					})}

					{selectedGoal && selectedGoal.location && (
						<Popup
							longitude={selectedGoal.location.longitude}
							latitude={selectedGoal.location.latitude}
							anchor="top"
							onClose={() => setSelectedGoal(null)}
							closeButton
							closeOnClick={false}
						>
							<div className="map-popup">
								<h4>{selectedGoal.title}</h4>
								<p>
									<strong>Место:</strong> {selectedGoal.location.name}, {selectedGoal.location.country}
								</p>
								{selectedGoal.location.city && (
									<p>
										<strong>Город:</strong> {selectedGoal.location.city}
									</p>
								)}
								<p>
									<strong>Сложность:</strong> {selectedGoal.complexity}
								</p>
								{selectedGoal.location.description && (
									<p>
										<strong>Описание:</strong> {selectedGoal.location.description}
									</p>
								)}

								<div className="map-popup-actions">
									{isLocationVisited(selectedGoal.location.id) ? (
										<button
											type="button"
											onClick={() => handleLocationUnvisit(selectedGoal.location!.id)}
											disabled={loading}
											className="btn btn-secondary"
										>
											Убрать отметку
										</button>
									) : (
										<button
											type="button"
											onClick={() => handleLocationVisit(selectedGoal.location!.id, selectedGoal.id)}
											disabled={loading}
											className="btn btn-primary"
										>
											Отметить как посещенное
										</button>
									)}
								</div>
							</div>
						</Popup>
					)}
				</MapLibreMap>
			</MapProvider>
		</div>
	);
};

export default Map;
