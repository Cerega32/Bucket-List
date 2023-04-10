const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

let mode = 'development';
let target = 'web'; // в режиме разработки browserslist не используется
const isDevelopment = process.env.NODE_ENV !== 'production';
if (process.env.NODE_ENV === 'production') {
	mode = 'production';
	target = 'browserslist'; // в продакшен режиме используем browserslist
}

const plugins = [
	new HtmlWebpackPlugin({
		template: './public/index.html', // Данный html будет использован как шаблон
	}),
	new MiniCssExtractPlugin({
		filename: '[name].[contenthash].css', // Формат имени файла
	}),
];

if (process.env.SERVE) {
	// Используем плагин только если запускаем devServer
	plugins.push(new ReactRefreshWebpackPlugin());
} // Данный код должен быть размещен после объявления массива plugins

module.exports = {
	mode,
	target,
	plugins, // Сокращенная запись plugins: plugins в ES6+
	entry: './src/index.tsx',
	devtool: 'source-map',
	output: {
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	module: {
		rules: [
			{test: /\.(html)$/, use: ['html-loader']}, // Добавляем загрузчик для html
			{
				test: /\.(s[ac]|c)ss$/i, // /\.(le|c)ss$/i если вы используете less
				use: [
					isDevelopment
						? 'style-loader'
						: MiniCssExtractPlugin.loader,
					'css-loader',
					'postcss-loader',
					'sass-loader',
				],
			},
			{
				test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
				type: mode === 'production' ? 'asset' : 'asset/resource', // В продакшен режиме
				// изображения размером до 8кб будут инлайнится в код
				// В режиме разработки все изображения будут помещаться в dist/assets
			},
			{
				test: /\.(woff2?|eot|ttf|otf)$/i,
				type: 'asset/resource',
			},
			{
				test: /\.[tj]sx?$/,
				exclude: /node_modules/, // не обрабатываем файлы из node_modules
				use: [
					{
						loader: require.resolve('babel-loader'),
						options: {
							plugins: [
								isDevelopment &&
									require.resolve('react-refresh/babel'),
							].filter(Boolean),
						},
					},
				],
			},
		],
	},
	resolve: {
		extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
	},
	devServer: {
		port: 3000,
		open: true,
		hot: true,
	},
};
