import React, {useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {Country, UserVisitedCountry, mapApi} from '@/utils/mapApi';
import './ScratchMap.scss';

interface ScratchMapProps {
	onCountryVisit?: (countryId: number) => void;
	onCountryUnvisit?: (countryId: number) => void;
	height?: string;
}

const ScratchMap: React.FC<ScratchMapProps> = ({onCountryVisit, onCountryUnvisit, height = '500px'}) => {
	const [countries, setCountries] = useState<Country[]>([]);
	const [visitedCountries, setVisitedCountries] = useState<UserVisitedCountry[]>([]);
	const [loading, setLoading] = useState(true);
	const [block, element] = useBem('scratch-map');

	const loadData = async () => {
		try {
			setLoading(true);
			const [countriesData, visitedData] = await Promise.all([mapApi.getCountriesList(), mapApi.getUserVisitedCountries()]);

			setCountries(countriesData);
			setVisitedCountries(visitedData);
		} catch (error) {
			console.error('Error loading scratch map data:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleCountryClick = async (country: Country) => {
		const isVisited = visitedCountries.some((vc) => vc.country.id === country.id);

		try {
			if (isVisited) {
				await mapApi.unmarkCountryVisited(country.id);
				setVisitedCountries((prev) => prev.filter((vc) => vc.country.id !== country.id));
				onCountryUnvisit?.(country.id);
			} else {
				const visitedCountry = await mapApi.markCountryVisited(country.id);
				setVisitedCountries((prev) => [...prev, visitedCountry]);
				onCountryVisit?.(country.id);
			}
		} catch (error) {
			console.error('Error updating country visit status:', error);
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent, country: Country) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleCountryClick(country);
		}
	};

	const isCountryVisited = (countryId: number) => {
		return visitedCountries.some((vc) => vc.country.id === countryId);
	};

	const visitedCount = visitedCountries.length;
	const totalCount = countries.length;
	const percentage = totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;

	if (loading) {
		return (
			<div className="scratch-map-loading" style={{height}}>
				<div className="loading-spinner">Загрузка карты...</div>
			</div>
		);
	}

	return (
		<div className={block()} style={{height}}>
			<div className={element('header')}>
				<h3>Скретч-карта мира</h3>
				<div className={element('stats')}>
					<span className={element('visited-count')}>{visitedCount}</span>
					<span className={element('separator')}>/</span>
					<span className={element('total-count')}>{totalCount}</span>
					<span className={element('percentage')}>({percentage}%)</span>
				</div>
			</div>

			<div className={element('container')}>
				{/* Здесь будет SVG карта мира */}
				<div className={element('world-map-placeholder')}>
					<p>Интерактивная карта мира будет здесь</p>
					<p>Нажмите на страну, чтобы отметить её как посещенную</p>
				</div>

				{/* Список стран для демонстрации */}
				<div className={element('countries-grid')}>
					{countries.map((country) => (
						<div
							key={country.id}
							className={`${element('country-item', {visited: isCountryVisited(country.id)})}`}
							role="button"
							tabIndex={0}
							onClick={() => handleCountryClick(country)}
							onKeyDown={(e) => handleKeyPress(e, country)}
							style={{
								backgroundColor: isCountryVisited(country.id) ? country.color_hex : '#f5f5f5',
							}}
						>
							<span className={element('	country-name')}>{country.name}</span>
							<span className={element('country-code')}>{country.iso_code}</span>
						</div>
					))}
				</div>
			</div>

			<div className={element('legend')}>
				<div className={element('legend-item')}>
					<div className={element('legend-color visited')} />
					<span>Посещенные страны</span>
				</div>
				<div className={element('legend-item')}>
					<div className={element('legend-color unvisited')} />
					<span>Не посещенные страны</span>
				</div>
			</div>
		</div>
	);
};

export default ScratchMap;
