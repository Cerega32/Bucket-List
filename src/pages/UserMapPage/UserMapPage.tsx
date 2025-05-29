import {observer} from 'mobx-react-lite';
import React, {useEffect, useState} from 'react';

import Map from '@/components/Map/Map';
import ScratchMap from '@/components/ScratchMap/ScratchMap';
import {useBem} from '@/hooks/useBem';
import {MapData, mapApi} from '@/utils/mapApi';
import './UserMapPage.scss';

const UserMapPage: React.FC = observer(() => {
	const [mapData, setMapData] = useState<MapData | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'locations' | 'countries'>('locations');
	const [block, element] = useBem('user-map-page');

	const loadUserMapData = async () => {
		try {
			setLoading(true);
			const data = await mapApi.getUserMapData();
			setMapData(data);
		} catch (error) {
			console.error('Error loading user map data:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUserMapData();
	}, []);

	const handleLocationVisit = async (locationId: number, goalId?: number) => {
		try {
			await mapApi.markLocationVisited(locationId, goalId);
			// Перезагружаем данные карты
			await loadUserMapData();
		} catch (error) {
			console.error('Error marking location as visited:', error);
		}
	};

	const handleLocationUnvisit = async (locationId: number) => {
		try {
			await mapApi.unmarkLocationVisited(locationId);
			// Перезагружаем данные карты
			await loadUserMapData();
		} catch (error) {
			console.error('Error unmarking location as visited:', error);
		}
	};

	if (loading) {
		return (
			<div className="user-map-page">
				<div className="loading-container">
					<div className="loading-spinner">Загрузка карт...</div>
				</div>
			</div>
		);
	}

	return (
		<div className={block()}>
			<div className={element('header')}>
				<h1>Мои карты</h1>
				<p>Отслеживайте свои путешествия и достижения на карте</p>
			</div>

			<div className={element('map-tabs')}>
				<button
					type="button"
					className={`${element('tab-button', {active: activeTab === 'locations'})}`}
					onClick={() => setActiveTab('locations')}
				>
					Карта мест
				</button>
				<button
					type="button"
					className={`${element('tab-button', {active: activeTab === 'countries'})}`}
					onClick={() => setActiveTab('countries')}
				>
					Скретч-карта стран
				</button>
			</div>

			<div className={element('map-content')}>
				{activeTab === 'locations' && (
					<div className={element('locations-tab')}>
						<div className={element('map-section')}>
							<div className={element('section-header')}>
								<h2>Места из ваших целей</h2>
								<div className={element('map-legend')}>
									<div className={element('legend-item')}>
										<div className={element('legend-marker visited')} />
										<span>Посещенные места</span>
									</div>
									<div className={element('legend-item')}>
										<div className={element('legend-marker unvisited')} />
										<span>Запланированные места</span>
									</div>
								</div>
							</div>

							{mapData && mapData.goals?.length > 0 ? (
								<Map
									goals={mapData.goals}
									visitedLocations={mapData.visited_locations}
									onLocationVisit={handleLocationVisit}
									onLocationUnvisit={handleLocationUnvisit}
									height="500px"
								/>
							) : (
								<div className={element('empty-state')}>
									<h3>У вас пока нет целей с местами</h3>
									<p>Добавьте цели с географическими местами, чтобы увидеть их на карте</p>
								</div>
							)}
						</div>

						{mapData && mapData.visited_locations?.length > 0 && (
							<div className={element('visited-locations-list')}>
								<h3>Посещенные места ({mapData.visited_locations?.length})</h3>
								<div className={element('locations-grid')}>
									{mapData.visited_locations.map((visitedLocation) => (
										<div key={visitedLocation.id} className={element('location-card')}>
											<h4>{visitedLocation.location.name}</h4>
											<p className="location-country">{visitedLocation.location.country}</p>
											{visitedLocation.location.city && (
												<p className="location-city">{visitedLocation.location.city}</p>
											)}
											{visitedLocation.goal_title && (
												<p className="related-goal">Цель: {visitedLocation.goal_title}</p>
											)}
											<p className="visit-date">
												Посещено: {new Date(visitedLocation.visited_at).toLocaleDateString('ru-RU')}
											</p>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{activeTab === 'countries' && (
					<div className={element('countries-tab')}>
						<ScratchMap height="600px" />
					</div>
				)}
			</div>
		</div>
	);
});

export default UserMapPage;
