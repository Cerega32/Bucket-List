import {numericToAlpha2} from './isoNumericToAlpha2';

/** ISO alpha-2 для географии TopoJSON / GeoJSON (Косово без числового id). */
export const resolveGeoIso = (geo: {id?: string | number; properties?: {name?: string}}): string => {
	const numericId = geo.id !== undefined && geo.id !== null ? String(geo.id) : '';
	const alpha2 = numericToAlpha2[numericId];
	if (alpha2) {
		return alpha2;
	}
	if (geo.properties?.name === 'Kosovo') {
		return 'xk';
	}
	return '';
};
