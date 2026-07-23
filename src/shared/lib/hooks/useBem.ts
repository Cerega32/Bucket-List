import {useCallback, useMemo} from 'react';

type Mod = boolean | string | undefined;
type BemMods = Record<string, Mod>;
type InputObject = [string, Mod];

const getMod = ([key, value]: InputObject): string => {
	return typeof value === 'string' ? `${key}-${value}` : key;
};

export const useBem = (
	blockName: string,
	className?: string
): [(mods?: BemMods) => string, (elem: string, mods?: BemMods, additionalClass?: string) => string] => {
	const blockClass = useMemo(() => blockName.trim(), [blockName]);
	const classClass = useMemo(() => (className || '').trim(), [className]);

	const block = useCallback(
		(mods?: BemMods): string => {
			if (!mods) {
				return `${blockClass} ${classClass}`.trim();
			}
			const modClasses = Object.entries(mods)
				.filter(([key]) => mods[key])
				.map((mod) => `${blockClass}--${getMod(mod)}`);

			return [blockClass, ...modClasses, classClass].join(' ').trim();
		},
		[blockClass, classClass]
	);

	const element = useCallback(
		(elem: string, mods?: BemMods, additionalClass?: string): string => {
			const elemClass = `${blockClass}__${elem.trim()}`;

			if (!mods) {
				return `${elemClass} ${additionalClass || ''}`.trim();
			}

			const modElemClasses = Object.entries(mods)
				.filter(([key]) => mods[key])
				.map((mod) => `${elemClass}--${getMod(mod)}`);

			const classes = [elemClass, ...modElemClasses];

			if (additionalClass) {
				classes.push(additionalClass);
			}

			return classes.join(' ');
		},
		[blockClass]
	);

	return [block, element];
};
