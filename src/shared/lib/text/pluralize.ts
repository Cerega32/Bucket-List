export const pluralize = (count: number, words: Array<string>, showCount = true): string => {
	if (count % 10 === 1 && count % 100 !== 11) {
		return `${showCount ? count : ''} ${words[0]}`;
	}
	if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
		return `${showCount ? count : ''} ${words[1] || words[0]}`;
	}

	return `${showCount ? count : ''} ${words[2] || words[0]}`;
};
