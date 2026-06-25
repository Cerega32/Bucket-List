import {neighbors} from 'topojson-client';

import {resolveGeoIso} from './resolveGeoIso';
import {SCRATCH_MAP_PALETTE_SIZE} from './scratchMapPalette';

interface TopoGeometry {
	type?: string;
	id?: string | number;
	properties?: {name?: string};
	arcs?: unknown;
	geometries?: TopoGeometry[];
}

interface TopoObject {
	geometries: TopoGeometry[];
}

interface TopoJson {
	objects: {countries: TopoObject};
}

/** Смежность ISO-кодов стран из челленджа по общим границам TopoJSON. */
const buildChallengeAdjacency = (topology: TopoJson, challengeIsos: Set<string>): Map<string, Set<string>> => {
	const geoms = topology.objects.countries.geometries;
	const indexToIso = geoms.map((g) => resolveGeoIso(g));
	const neighborIndices = neighbors(geoms as Parameters<typeof neighbors>[0]);
	const adjacency = new Map<string, Set<string>>();

	const link = (isoA: string, isoB: string) => {
		let neighborsOfA = adjacency.get(isoA);
		if (!neighborsOfA) {
			neighborsOfA = new Set();
			adjacency.set(isoA, neighborsOfA);
		}
		neighborsOfA.add(isoB);
	};

	geoms.forEach((_geo, index) => {
		const iso = indexToIso[index];
		if (!iso || !challengeIsos.has(iso)) {
			return;
		}
		neighborIndices[index].forEach((neighborIndex: number) => {
			const neighborIso = indexToIso[neighborIndex];
			if (neighborIso && neighborIso !== iso && challengeIsos.has(neighborIso)) {
				link(iso, neighborIso);
				link(neighborIso, iso);
			}
		});
	});

	return adjacency;
};

const isoHashIndex = (iso: string): number => {
	let hash = 0;
	for (let i = 0; i < iso.length; i += 1) {
		hash = (hash * 31 + iso.charCodeAt(i)) % SCRATCH_MAP_PALETTE_SIZE;
	}
	return hash;
};

/**
 * Раскраска: у каждой страны свой «любимый» цвет по хешу ISO, при конфликте с соседом —
 * следующий по кругу; среди равных приоритет у менее занятых в мире оттенков.
 * (Чистая графовая жадность давала index 0 у сотен несоседних стран — карта выглядела пятнами одного цвета.)
 */
const assignColorIndices = (challengeIsos: Set<string>, adjacency: Map<string, Set<string>>): Map<string, number> => {
	const sorted = [...challengeIsos].sort((a, b) => (adjacency.get(b)?.size ?? 0) - (adjacency.get(a)?.size ?? 0));
	const colors = new Map<string, number>();
	const usageCount = new Array<number>(SCRATCH_MAP_PALETTE_SIZE).fill(0);

	sorted.forEach((iso) => {
		const blocked = new Set<number>();
		adjacency.get(iso)?.forEach((neighbor) => {
			const neighborColor = colors.get(neighbor);
			if (neighborColor !== undefined) {
				blocked.add(neighborColor);
			}
		});

		const preferred = isoHashIndex(iso);
		const candidates = Array.from({length: SCRATCH_MAP_PALETTE_SIZE}, (_, offset) => (preferred + offset) % SCRATCH_MAP_PALETTE_SIZE);
		candidates.sort((a, b) => {
			const aBlocked = blocked.has(a) ? 1 : 0;
			const bBlocked = blocked.has(b) ? 1 : 0;
			if (aBlocked !== bBlocked) {
				return aBlocked - bBlocked;
			}
			return usageCount[a] - usageCount[b];
		});

		const colorIndex = candidates[0] ?? 0;
		colors.set(iso, colorIndex);
		usageCount[colorIndex] += 1;
	});

	return colors;
};

export const computeMapColorAssignment = async (geoUrl: string, challengeIsos: Iterable<string>): Promise<Map<string, number>> => {
	const challengeSet = new Set(challengeIsos);
	if (challengeSet.size === 0) {
		return new Map();
	}
	const response = await fetch(geoUrl);
	const topology = (await response.json()) as TopoJson;
	const adjacency = buildChallengeAdjacency(topology, challengeSet);
	return assignColorIndices(challengeSet, adjacency);
};
