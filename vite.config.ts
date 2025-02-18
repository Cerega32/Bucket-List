import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';

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
		preprocessorOptions: {
			scss: {
				additionalData: `@use "@/_commons/styles-supports/mixins" as *;`,
			},
		},
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
		proxy: {
			'/api': {
				target: 'http://localhost:8000', // Замените на адрес вашего Django-сервера
				changeOrigin: true,
			},
			'/media': {
				target: 'http://localhost:8000', // Замените на адрес вашего Django-сервера
				changeOrigin: true,
			},
		},
	},
};
