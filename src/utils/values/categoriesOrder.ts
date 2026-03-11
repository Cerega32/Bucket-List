import {ICategory, ICategoryDetailed} from '@/typings/goal';

type CategoryLike = Pick<ICategory, 'nameEn'> | Pick<ICategoryDetailed, 'nameEn'>;

export const CATEGORY_ORDER: string[] = [
	'health-and-sport',
	'education',
	'relations',
	'arts-and-culture',
	'travel',
	'entertainment-and-hobby',
];

export const sortMainCategories = <T extends CategoryLike>(list: T[]): T[] => {
	return [...list].sort((a, b) => {
		const aIndex = CATEGORY_ORDER.indexOf(a.nameEn);
		const bIndex = CATEGORY_ORDER.indexOf(b.nameEn);

		const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
		const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

		return safeA - safeB;
	});
};
