import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import {fileURLToPath, URL} from 'url';

const path = require('path');

const postcssGlobalData = require('@csstools/postcss-global-data');

export default {
	plugins: [react(), legacy()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	css: {
		postcss: {
			plugins: [
				require('postcss-normalize'),
				postcssGlobalData({
					files: ['./src/_commons/styles-supports/variables.scss'],
				}),
				require('autoprefixer'),
				require('postcss-sort-media-queries'),
				require('postcss-normalize-charset'),
				// require('postcss-preset-env'),
			],
		},
	},
	build: {
		outDir: 'dist',
		cleanCssOptions: {
			level: {
				1: {
					specialComments: 'none',
				},
			},
		},
	},
	server: {
		port: 3000,
		open: true,
		hmr: {
			overlay: false,
		},
	},
};
