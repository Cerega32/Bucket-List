import {observer} from 'mobx-react-lite';
import React, {useEffect, useState} from 'react';

import {GoalMapMulti} from '@/components/GoalMap/GoalMapMulti';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';
import {MapData, mapApi} from '@/utils/mapApi';
import './UserMapPage.scss';

const UserMapPage: React.FC<IPage> = observer(({page}) => {
	const [mapData, setMapData] = useState<MapData | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab] = useState<'locations' | 'countries'>('locations');
	const [block, element] = useBem('user-map-page');

	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
	}, []);

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

	return (
		<Loader isLoading={loading} className={block()}>
			<div className={element('header')}>
				<h1>Мои карты</h1>
				<p>Отслеживайте свои путешествия и достижения на карте</p>
			</div>

			{/* <div className={element('map-tabs')}>
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
			</div> */}

			<div className={element('map-content')}>
				{activeTab === 'locations' && (
					<div className={element('locations-tab')}>
						<div className={element('map-section')}>
							<div className={element('section-header')}>
								<h2>Места из ваших целей</h2>
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
							</div>

							{mapData && mapData.goals?.length > 0 ? (
								<GoalMapMulti
									goals={mapData.goals
										.filter(
											(goal) =>
												goal.location &&
												typeof goal.location.latitude === 'number' &&
												typeof goal.location.longitude === 'number'
										)
										.map((goal) => ({
											location: goal.location!,
											userVisitedLocation: goal.completedByUser,
											name: goal.title,
											address: goal.location!.address,
											description: goal.description,
										}))}
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

				{/* {activeTab === 'countries' && (
					<div className={element('countries-tab')}>
						<ScratchMap height="600px" />
					</div>
				)} */}
			</div>
		</Loader>
	);
});

export default UserMapPage;
