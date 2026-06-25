import {observer} from 'mobx-react-lite';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useLocation} from 'react-router-dom';

import {Banner} from '@/components/Banner/Banner';
import {CountriesScratchMap} from '@/components/CountriesScratchMap/CountriesScratchMap';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {GoalMapMulti} from '@/components/GoalMap/GoalMapMulti';
import {Switch} from '@/components/Switch/Switch';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {goalsToMapPoints, MapData, mapApi} from '@/utils/mapApi';
import {YANDEX_MAP_LOAD_ERROR_MESSAGE} from '@/utils/maps/loadYandexMapsScript';

import {UserMapPageSkeleton} from './UserMapPageSkeleton';
import './user-map-page.scss';

const UserMapPage: React.FC = observer(() => {
	const [mapData, setMapData] = useState<MapData | null>(null);
	const [loading, setLoading] = useState(true);
	const [mapLoadError, setMapLoadError] = useState(false);
	const location = useLocation();
	const activeTab = (location.hash === '#countries' ? 'countries' : 'locations') as 'locations' | 'countries';
	const [block, element] = useBem('user-map-page');

	const mapSwitchButtons = useMemo(
		() => [
			{url: '#locations', name: 'Карта мест', page: 'locations'},
			{url: '#countries', name: 'Скретч-карта', page: 'countries'},
		],
		[]
	);

	const handleMapLoadError = useCallback(() => {
		setMapLoadError(true);
	}, []);

	const handleMapLoadSuccess = useCallback(() => {
		setMapLoadError(false);
	}, []);

	const {setHeader, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setFull(false);
	}, []);

	const loadUserMapData = async () => {
		try {
			setLoading(true);
			const data = await mapApi.getUserMapData();
			setMapData(data);
		} catch {
			setMapData(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUserMapData();
	}, []);

	if (loading) {
		return <UserMapPageSkeleton />;
	}

	return (
		<div className={block()}>
			<div className={element('content')}>
				<Title tag="h2" className={element('title')}>
					Мои карты
				</Title>

				<Switch className={element('switch')} buttons={mapSwitchButtons} active={activeTab} />

				<div className={element('map-content')}>
					{activeTab === 'locations' && (
						<div className={element('locations-tab')}>
							<div className={element('map-section')}>
								{/* <div className={element('section-header')}> */}
								{/* <div className={element('map-legend')}>
										<div className={element('legend-item')}>
											<div className={element('legend-marker visited')} />
											<span>Посещенные места</span>
										</div>
										<div className={element('legend-item')}>
											<div className={element('legend-marker unvisited')} />
											<span>Запланированные места</span>
										</div>
									</div> */}
								{/* </div> */}

								{mapData && mapData.goals?.length > 0 ? (
									<>
										{mapLoadError && (
											<Banner
												type="warning"
												className={element('map-load-banner')}
												message={YANDEX_MAP_LOAD_ERROR_MESSAGE}
											/>
										)}
										<GoalMapMulti
											goals={goalsToMapPoints(mapData.goals)}
											onLoadError={handleMapLoadError}
											onLoadSuccess={handleMapLoadSuccess}
										/>
									</>
								) : (
									<EmptyState
										title="У вас пока нет целей с местами"
										description="Добавьте цели с географическими местами, чтобы увидеть их на карте"
									/>
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
							<CountriesScratchMap />
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

export default UserMapPage;
