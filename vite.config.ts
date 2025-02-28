import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';

const path = require('path');

const postcssGlobalData = require('@csstools/postcss-global-data');

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
	// Загрузка переменных окружения в зависимости от режима (development/production)
	const env = loadEnv(mode, process.cwd(), '');

	return {
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
			sourcemap: mode === 'development',
			minify: mode === 'production',
		},
		server: {
			port: 3000,
			open: true,
			hmr: {
				overlay: false,
			},
			proxy: {
				'/api': {
					target: env.VITE_API_URL || 'http://localhost:8000',
					changeOrigin: true,
				},
				'/media': {
					target: env.VITE_API_URL || 'http://localhost:8000',
					changeOrigin: true,
				},
			},
		},
		// Добавляем переменные окружения, которые будут доступны в приложении
		define: {
			'process.env': env,
		},
	};
});
