import {GeoProjection, geoCentroid} from 'd3-geo';

import {getMicroStateVisualScale} from './microStateVisualScale';

/** SVG transform: слегка увеличить полигон микрогосударства вокруг его центра (в координатах текущей проекции). */
export const getMicroStateTransform = (geo: {type?: string}, iso: string, projection: GeoProjection): string | undefined => {
	const visualScale = getMicroStateVisualScale(iso);
	if (!visualScale) {
		return undefined;
	}
	try {
		const [lng, lat] = geoCentroid(geo as GeoJSON.Feature);
		const point = projection([lng, lat]);
		if (!point) {
			return undefined;
		}
		const [cx, cy] = point;
		return `translate(${cx},${cy}) scale(${visualScale}) translate(${-cx},${-cy})`;
	} catch {
		return undefined;
	}
};
