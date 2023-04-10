const postcssGlobalData = require('@csstools/postcss-global-data');

module.exports = {
	plugins: [
		'postcss-normalize',
		postcssGlobalData({
			files: ['./src/styles/variables.scss'],
		}),
		'autoprefixer',
		'postcss-sort-media-queries',
		'postcss-normalize-charset',
		'postcss-preset-env',
	],
};
