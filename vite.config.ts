import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const path = require('path');

const postcssCustomMedia = require('postcss-custom-media');
// Убираем сортировку медиа-запросов, чтобы сохранить порядок как в исходном файле
// const postcssSortMediaQueries = require('postcss-sort-media-queries');

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
	// Загрузка переменных окружения в зависимости от режима (development/production)
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [react(), legacy()],
		base: '/',
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
		css: {
			preprocessorOptions: {
				scss: {
					// Vite 4 не поддерживает api: 'modern' (только с 5.4+). Подавляем предупреждение до перехода на Vite 5.4+.
					silenceDeprecations: ['legacy-js-api'],
					additionalData: `
					@use "@/_commons/styles-supports/mixins" as *;
				`,
				},
			},
			postcss: {
				plugins: [
					require('postcss-normalize'),
					require('autoprefixer'),
					// Отключаем сортировку медиа-запросов
					// postcssSortMediaQueries({
					//	sort: 'desktop-first',
					// }),
					require('postcss-normalize-charset'),
					// require('postcss-preset-env'),
				],
			},
		},
		build: {
			outDir: 'dist',
			assetsDir: 'assets',
			assetsInlineLimit: 4096, // Файлы меньше 4kb будут инлайниться
			chunkSizeWarningLimit: 1000, // Увеличение лимита размера чанка
			cleanCssOptions: {
				level: {
					1: {
						specialComments: 'none',
					},
				},
			},
			sourcemap: mode === 'development',
			minify: mode === 'production',
			target: 'es2020', // Поддержка BigInt
			rollupOptions: {
				output: {
					manualChunks: {
						vendor: ['react', 'react-dom'],
						ui: ['framer-motion', 'react-router-dom'],
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
