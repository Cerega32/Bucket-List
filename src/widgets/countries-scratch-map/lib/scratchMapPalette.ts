/** Палитра раскраски стран на скретч-карте (графовая раскраска по соседству). */
export const SCRATCH_MAP_COUNTRY_PALETTE = [
	'var(--color-education)',
	'var(--color-health-and-sport)',
	'var(--color-arts-and-culture)',
	'var(--color-entertainment-and-hobby)',
	'var(--color-relations)',
	'var(--color-travel)',
	'var(--color-yellow)',
	'var(--color-bronze)',
	'var(--color-gold)',
	'var(--color-green-5)',
	'var(--color-yellow-3)',
	'var(--color-purple-2)',
	'var(--color-orange-2)',
	'var(--color-blue-6)',
] as const;

export const SCRATCH_MAP_PALETTE_SIZE = SCRATCH_MAP_COUNTRY_PALETTE.length;

export const SCRATCH_MAP_GLOBE_FILL = 'var(--color-primary)';

/** Невыполненные страны — тёмно-серый с заметным оттенком цвета категории. */
export const SCRATCH_MAP_UNVISITED_PALETTE = SCRATCH_MAP_COUNTRY_PALETTE.map(
	(color) => `color-mix(in srgb, ${color} 2%, var(--color-gray-12))`
);

/** Территории вне челленджа — чуть светлее океана. */
export const SCRATCH_MAP_NEUTRAL_FILL = 'color-mix(in srgb, var(--color-white) 22%, var(--color-primary))';
