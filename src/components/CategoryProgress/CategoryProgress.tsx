import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {ICategoryProgress} from '@/typings/dashboard';

import {Title} from '../Title/Title';

import './category-progress.scss';

// Функция для генерации случайного цвета на основе строки
function getRandomColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i += 1) {
		hash = str.charCodeAt(i) + (hash * 5 - hash);
	}
	const color = Math.floor(Math.abs(Math.sin(hash) * 16777215)).toString(16);
	return `#${'0'.repeat(6 - color.length)}${color}`;
}

interface CategoryProgressProps {
	className?: string;
	data: ICategoryProgress[];
}

export const CategoryProgress: FC<CategoryProgressProps> = ({className, data}) => {
	const [block, element] = useBem('category-progress', className);

	// Подготовим данные для диаграммы
	const totalSize = 280; // Размер диаграммы в пикселях
	const radius = totalSize / 2;
	const centerX = radius;
	const centerY = radius;
	const innerRadius = radius * 0.6;

	// Сортируем категории, чтобы сначала шли с большим количеством целей
	const sortedData = [...data].sort((a, b) => b.total - a.total);

	// Создаем сегменты диаграммы
	const segments: Array<{
		path: string;
		color: string;
		name: string;
		completed: number;
		total: number;
		percentage: number;
	}> = [];

	if (sortedData.length > 0) {
		let startAngle = 0;
		const totalGoals = sortedData.reduce((sum, category) => sum + category.total, 0);

		sortedData.forEach((category) => {
			const percentage = totalGoals > 0 ? (category.total / totalGoals) * 100 : 0;
			const angle = (percentage / 100) * 360;
			const endAngle = startAngle + angle;

			// Конвертируем углы в радианы для расчета координат
			const startRad = (startAngle * Math.PI) / 180;
			const endRad = (endAngle * Math.PI) / 180;

			// Рассчитываем координаты для дуги
			const x1 = centerX + radius * Math.cos(startRad);
			const y1 = centerY + radius * Math.sin(startRad);
			const x2 = centerX + radius * Math.cos(endRad);
			const y2 = centerY + radius * Math.sin(endRad);

			// Определяем путь дуги (большая дуга, если угол > 180 градусов)
			const largeArcFlag = angle > 180 ? 1 : 0;

			// Создаем строку пути SVG для дуги
			const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

			segments.push({
				path,
				color: category.color || getRandomColor(category.name),
				name: category.name,
				completed: category.completed,
				total: category.total,
				percentage: category.percentage,
			});

			startAngle = endAngle;
		});
	}

	return (
		<section className={block()}>
			<Title className={element('title')} tag="h3">
				Прогресс по категориям
			</Title>

			{sortedData.length > 0 ? (
				<div className={element('content')}>
					<div className={element('chart')}>
						<svg width={totalSize} height={totalSize} viewBox={`0 0 ${totalSize} ${totalSize}`}>
							{segments.map((segment) => (
								<path
									key={`segment-${segment.name}`}
									d={segment.path}
									fill={segment.color}
									className={element('segment')}
									data-category={segment.name}
								/>
							))}
							<circle cx={centerX} cy={centerY} r={innerRadius} fill="var(--color-white)" />
						</svg>
					</div>

					<div className={element('legend')}>
						{sortedData.map((category, i) => (
							<div key={`legend-${category.name}`} className={element('legend-item')}>
								<div
									className={element('color-indicator')}
									style={{backgroundColor: segments[i]?.color || getRandomColor(category.name)}}
								/>
								<div className={element('category-info')}>
									<span className={element('category-name')}>{category.name}</span>
									<span className={element('category-stats')}>
										{category.completed}/{category.total} ({category.percentage}%)
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div className={element('empty')}>
					<p>Нет данных о прогрессе по категориям</p>
				</div>
			)}
		</section>
	);
};
