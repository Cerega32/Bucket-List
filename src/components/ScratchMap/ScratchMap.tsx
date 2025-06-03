import React, {useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {Country, UserVisitedCountry, mapApi} from '@/utils/mapApi';

import './ScratchMap.scss';
import WorldMap from './WorldMap';

interface ScratchMapProps {
	onCountryVisit?: (countryId: number) => void;
	onCountryUnvisit?: (countryId: number) => void;
	height?: string;
}

const ScratchMap: React.FC<ScratchMapProps> = ({onCountryVisit, onCountryUnvisit, height = '500px'}) => {
	const [countries, setCountries] = useState<Country[]>([]);
	const [visitedCountries, setVisitedCountries] = useState<UserVisitedCountry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);
	const [block, element] = useBem('scratch-map');

	const loadData = async () => {
		try {
			setLoading(true);
			setError(null);

			const [countriesData, visitedData] = await Promise.all([mapApi.getCountriesList(), mapApi.getUserVisitedCountries()]);

			if (!countriesData || countriesData.length === 0) {
				throw new Error('Не удалось загрузить список стран');
			}

			setCountries(countriesData);
			setVisitedCountries(visitedData || []);
		} catch (loadError) {
			// eslint-disable-next-line no-console
			console.error('Error loading scratch map data:', loadError);
			setError('Не удалось загрузить данные карты. Попробуйте обновить страницу.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleCountryClick = async (countryIsoCode: string) => {
		try {
			if (!countries || countries.length === 0) return;

			const country = countries.find((c) => c.iso_code?.toLowerCase() === countryIsoCode.toLowerCase());
			if (!country) {
				// eslint-disable-next-line no-console
				console.warn('Country not found:', countryIsoCode);
				return;
			}

			const isVisited = visitedCountries.some((vc) => vc.country.id === country.id);

			if (isVisited) {
				await mapApi.unmarkCountryVisited(country.id);
				setVisitedCountries((prev) => prev.filter((vc) => vc.country.id !== country.id));
				onCountryUnvisit?.(country.id);
			} else {
				const visitedCountry = await mapApi.markCountryVisited(country.id);
				setVisitedCountries((prev) => [...prev, visitedCountry]);
				onCountryVisit?.(country.id);
			}
		} catch (clickError) {
			// eslint-disable-next-line no-console
			console.error('Error updating country visit status:', clickError);
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent, countryIsoCode: string) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleCountryClick(countryIsoCode);
		}
	};

	const visitedCountryIds = visitedCountries.map((vc) => vc.country.id);
	const visitedCount = visitedCountries.length;
	const totalCount = countries.length;
	const percentage = totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;

	if (loading) {
		return (
			<div className={element('loading')} style={{height}}>
				<div className="loading-spinner">Загрузка карты...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={element('error')} style={{height}}>
				<div className="error-message">
					<h3>Ошибка загрузки</h3>
					<p>{error}</p>
					<button type="button" onClick={loadData} className="retry-button">
						Попробовать снова
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={block()} style={{height}}>
			<div className={element('header')}>
				<h3>Скретч-карта мира</h3>
				<p className={element('description')}>
					Кликните на страну, чтобы отметить её как посещенную. Посещенные страны станут цветными!
				</p>
				<div className={element('stats')}>
					<span className={element('visited-count')}>{visitedCount}</span>
					<span className={element('separator')}>/</span>
					<span className={element('total-count')}>{totalCount}</span>
					<span className={element('percentage')}>({percentage}%)</span>
				</div>
				{hoveredCountry && (
					<div className={element('hovered-country')}>
						Наведена мышь: <strong>{hoveredCountry.name}</strong>
					</div>
				)}
			</div>

			<div className={element('container')}>
				<WorldMap
					countries={countries}
					visitedCountries={visitedCountryIds}
					onCountryClick={handleCountryClick}
					onCountryHover={setHoveredCountry}
				/>
			</div>

			<div className={element('legend')}>
				<div className={element('legend-item')}>
					<div className={element('legend-color', {visited: true})} />
					<span>Посещенные страны</span>
				</div>
				<div className={element('legend-item')}>
					<div className={element('legend-color', {unvisited: true})} />
					<span>Не посещенные страны</span>
				</div>
			</div>

			{/* Дополнительный список стран для отладки/резерва */}
			<details className={element('countries-list')}>
				<summary>Полный список стран ({countries.length})</summary>
				<div className={element('countries-grid')}>
					{countries.map((country) => {
						const isVisited = visitedCountries.some((vc) => vc.country.id === country.id);
						return (
							<div
								key={country.id}
								className={element('country-item', {visited: isVisited})}
								role="button"
								tabIndex={0}
								onClick={() => handleCountryClick(country.iso_code)}
								onKeyPress={(event) => handleKeyPress(event, country.iso_code)}
								style={{
									backgroundColor: isVisited ? country.color_hex : '#f5f5f5',
									color: isVisited ? '#fff' : '#333',
								}}
							>
								<span className={element('country-name')}>{country.name}</span>
								<span className={element('country-code')}>{country.iso_code}</span>
							</div>
						);
					})}
				</div>
			</details>
		</div>
	);
};

export default ScratchMap;
