/* eslint-disable max-len */
import {useEffect, useState} from 'react';

import {IGoal} from '@/typings/goal';
import {IList} from '@/typings/list';
import {pluralize} from '@/utils/text/pluralize';

interface UseOGImageProps {
	goal?: IGoal;
	list?: IList;
	width?: number;
	height?: number;
}

// Функция для получения RGB цвета категории из custom-properties
const getCategoryColor = (categoryName: string): string => {
	const categoryColors: {[key: string]: string} = {
		// Основные категории
		travel: '100 177 22', // --color-travel-rgb
		education: '118 22 177', // --color-education-rgb
		'health-and-sport': '22 168 177', // --color-health-and-sport-rgb
		relations: '177 22 22', // --color-relations-rgb
		entertainment: '177 161 22', // --color-entertainment-rgb
		'100-goals': '255 208 44', // --color-100-goals-rgb

		// Подкатегории образования
		'career-success': '126 38 179', // --color-career-success-rgb
		'intellectual-development': '133 53 186', // --color-intellectual-development-rgb

		// Подкатегории здоровья и спорта
		sport: '35 173 178', // --color-sport-rgb
		'wellness-and-health': '49 179 183', // --color-wellness-and-health-rgb

		// Подкатегории развлечений
		hobby: '180 165 39', // --color-hobby-rgb
		'musical-experiences': '184 170 48', // --color-musical-experiences-rgb
		'creative-arts': '187 174 56', // --color-creative-arts-rgb
		gaming: '191 178 65', // --color-gaming-rgb
		'cinema-art': '195 182 73', // --color-cinema-art-rgb
		books: '198 186 82', // --color-books-rgb

		// Подкатегории отношений
		'community-contribution': '185 45 45', // --color-community-contribution-rgb
		'romantic-moments': '192 68 68', // --color-romantic-moments-rgb

		// Подкатегории путешествий
		'cultural-immersion': '110 183 36', // --color-cultural-immersion-rgb
		'culinary-explorations': '120 189 50', // --color-culinary-explorations-rgb
		'unique-places': '129 195 64', // --color-unique-places-rgb
	};

	return categoryColors[categoryName.toLowerCase()] || '58 137 216'; // fallback --color-primary-rgb
};

export const useOGImage = ({goal, list, width = 1200, height = 630}: UseOGImageProps) => {
	const [imageUrl, setImageUrl] = useState<string>('');
	const [isGenerating, setIsGenerating] = useState(false);

	useEffect(() => {
		const data = goal || list;
		if (!data) return;

		const generateImage = async () => {
			setIsGenerating(true);

			try {
				// Создаем canvas
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');

				if (!ctx) {
					setIsGenerating(false);
					return;
				}

				// Создаем градиентный фон только если нет изображения
				let gradient;
				if (data.category && data.category.nameEn) {
					// Получаем цвет категории из CSS переменных
					const categoryColor = getCategoryColor(data.category.nameEn);
					gradient = ctx.createLinearGradient(0, 0, 0, height);
					gradient.addColorStop(0, `rgba(${categoryColor} / 50%)`);
					gradient.addColorStop(0.1, `rgba(${categoryColor} / 60%)`);
					gradient.addColorStop(0.2, `rgba(${categoryColor} / 70%)`);
					gradient.addColorStop(0.3, `rgba(${categoryColor} / 80%)`);
					gradient.addColorStop(1, '#000000');
				} else {
					// Fallback градиент
					gradient = ctx.createLinearGradient(0, 0, 0, height);
					gradient.addColorStop(0, 'rgba(102, 126, 234, 0.5)');
					gradient.addColorStop(1, '#000000');
				}

				// Функция для отрисовки SVG фона
				const drawSVGBackground = () => {
					const bgImg = new Image();
					bgImg.onload = () => {
						ctx?.drawImage(bgImg, 0, 0, width, height);
					};
					bgImg.src = `data:image/svg+xml;base64,${btoa(`
						<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g clip-path="url(#clip0_2617_36803)">
								<rect width="1200" height="630" fill="#3A89D8"/>
								<path d="M600 533.182C720.49 533.182 818.182 435.503 818.182 315C818.182 194.497 720.49 96.8182 600 96.8182C479.51 96.8182 381.818 194.497 381.818 315C381.818 435.503 479.51 533.182 600 533.182Z" fill="white" fill-opacity="0.04"/>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M1200 315C1200 646.374 931.321 915 600 915C268.679 915 0 646.374 0 315C0 -16.3743 268.679 -285 600 -285C931.321 -285 1200 -16.3743 1200 315ZM1036.36 315C1036.36 555.993 840.98 751.364 600 751.364C359.02 751.364 163.636 555.993 163.636 315C163.636 74.0066 359.02 -121.364 600 -121.364C840.98 -121.364 1036.36 74.0066 1036.36 315Z" fill="white" fill-opacity="0.04"/>
							</g>
							<defs>
								<clipPath id="clip0_2617_36803">
									<rect width="1200" height="630" fill="white"/>
								</clipPath>
							</defs>
						</svg>
					`)}`;
				};

				// Если есть изображение, добавляем его как фон
				if (data.image) {
					const drawImageOnCanvas = (img: HTMLImageElement) => {
						// Рисуем изображение цели
						const imgAspect = img.width / img.height;
						const canvasAspect = width / height;

						let drawWidth;
						let drawHeight;
						let drawX;
						let drawY;

						if (imgAspect > canvasAspect) {
							// Изображение шире - подгоняем по высоте
							drawHeight = height;
							drawWidth = height * imgAspect;
							drawX = (width - drawWidth) / 2;
							drawY = 0;
						} else {
							// Изображение выше - подгоняем по ширине
							drawWidth = width;
							drawHeight = width / imgAspect;
							drawX = 0;
							drawY = (height - drawHeight) / 2;
						}

						ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
					};

					// Пробуем загрузить через fetch как blob
					const imageUrlLoad = data.image.startsWith('http') ? data.image : `${window.location.origin}${data.image}`;

					try {
						const response = await fetch(imageUrlLoad, {
							mode: 'cors',
							credentials: 'omit',
						});

						if (response.ok) {
							const blob = await response.blob();
							const img = new Image();

							await new Promise<boolean>((resolve) => {
								img.onload = () => {
									drawImageOnCanvas(img);
									resolve(true);
								};
								img.onerror = () => {
									resolve(false);
								};
								img.src = URL.createObjectURL(blob);
							});
						} else {
							throw new Error('Ошибка загрузки изображения');
						}
					} catch (error) {
						// Fallback: пробуем обычную загрузку без CORS
						try {
							const img = new Image();
							await new Promise<boolean>((resolve) => {
								img.onload = () => {
									drawImageOnCanvas(img);
									resolve(true);
								};
								img.onerror = () => {
									// Если изображение не загрузилось, используем SVG фон
									drawSVGBackground();
									resolve(false);
								};
								img.src = imageUrlLoad;
							});
						} catch (fallbackError) {
							// Если все не удалось, используем SVG фон
							drawSVGBackground();
						}
					}
				} else {
					// Если нет изображения, используем SVG фон
					drawSVGBackground();
				}

				// Заголовок в левом верхнем углу
				ctx.textAlign = 'left';
				ctx.textBaseline = 'top';
				ctx.fillStyle = '#ffffff';
				ctx.font = 'bold 40px Inter, sans-serif';

				// Разбиваем длинный заголовок на строки
				const words = data.title.split(' ').filter((word: string) => word.trim() !== '');
				const lines = [];
				let currentLine = '';
				const maxWidth = 912; // Максимальная ширина 912px

				for (let i = 0; i < words.length; i++) {
					const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
					const metrics = ctx.measureText(testLine);

					if (metrics.width > maxWidth && currentLine) {
						lines.push(currentLine);
						currentLine = words[i];
					} else {
						currentLine = testLine;
					}
				}
				if (currentLine) {
					lines.push(currentLine);
				}

				// Ограничиваем количество строк (больше для целей, меньше для списков)
				const maxLines = goal ? 6 : 4;
				if (lines.length > maxLines) {
					lines.splice(maxLines - 1);
					if (lines[maxLines - 1] && lines[maxLines - 1].length > 3) {
						lines[maxLines - 1] = `${lines[maxLines - 1].substring(0, lines[maxLines - 1].length - 3)}...`;
					}
				}

				// Рисуем заголовок
				const lineHeight = 52;
				const startX = 72;
				const startY = 72;

				lines.forEach((line: string, index: number) => {
					// Добавляем тень для лучшей читаемости
					// ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
					// ctx.shadowBlur = 4;
					// ctx.shadowOffsetX = 2;
					// ctx.shadowOffsetY = 2;

					ctx.fillText(line, startX, startY + index * lineHeight);

					// Сбрасываем тень
					ctx.shadowColor = 'transparent';
					ctx.shadowBlur = 0;
					ctx.shadowOffsetX = 0;
					ctx.shadowOffsetY = 0;
				});

				// Тег категории внизу слева
				if (data.category) {
					const categoryColor = getCategoryColor(data.category.nameEn);
					const tagX = 72;
					const tagY = height - 78 - 40; // 40px высота тега
					const tagHeight = 40;

					// Устанавливаем шрифт для измерения ширины
					ctx.font = '500 24px Inter, sans-serif';
					const textWidth = ctx.measureText(data.category.name).width;
					const tagWidth = textWidth + 24; // padding 12px с каждой стороны

					// Рисуем фон тега с закругленными углами
					ctx.fillStyle = `rgb(${categoryColor})`;
					ctx.beginPath();
					ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 8);
					ctx.fill();

					// Рисуем текст тега
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'left';
					ctx.textBaseline = 'middle';

					ctx.fillText(data.category.name, tagX + 12, tagY + 2 + tagHeight / 2);
				}

				// Тег количества целей (только для списков)
				if (list) {
					const goalsCount = list.goalsCount || 0;
					const goalsText = pluralize(goalsCount, ['цель', 'цели', 'целей'], true);

					// Позиционируем тег количества целей справа от категории
					const countTagX = data.category ? 72 + ctx.measureText(data.category.name).width + 24 + 16 : 72; // 16px отступ от категории
					const countTagY = height - 78 - 40;
					const countTagHeight = 40;

					// Устанавливаем шрифт для измерения ширины
					ctx.font = '500 24px Inter, sans-serif';
					const countTextWidth = ctx.measureText(goalsText).width;
					const iconSize = 24; // Размер иконки
					const iconPadding = 8; // Отступ между иконкой и текстом
					const countTagWidth = countTextWidth + iconSize + iconPadding + 24; // padding 12px с каждой стороны + иконка

					// Рисуем фон тега количества с закругленными углами
					ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
					ctx.beginPath();
					ctx.roundRect(countTagX, countTagY, countTagWidth, countTagHeight, 8);
					ctx.fill();

					// Рисуем рамку тега
					ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
					ctx.lineWidth = 1;
					ctx.stroke();

					// Рисуем иконку
					const iconX = countTagX + 12;
					const iconY = countTagY + (countTagHeight - iconSize) / 2;

					// Загружаем и рисуем SVG иконку
					const iconImg = new Image();
					iconImg.onload = () => {
						ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
					};
					iconImg.src = `data:image/svg+xml;base64,${btoa(`
						<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M13.3337 17.3337H4.00033C3.6467 17.3337 3.30756 17.4741 3.05752 17.7242C2.80747 17.9742 2.66699 18.3134 2.66699 18.667V28.0003C2.66699 28.3539 2.80747 28.6931 3.05752 28.9431C3.30756 29.1932 3.6467 29.3337 4.00033 29.3337H13.3337C13.6873 29.3337 14.0264 29.1932 14.2765 28.9431C14.5265 28.6931 14.667 28.3539 14.667 28.0003V18.667C14.667 18.3134 14.5265 17.9742 14.2765 17.7242C14.0264 17.4741 13.6873 17.3337 13.3337 17.3337ZM12.0003 26.667H5.33366V20.0003H12.0003V26.667ZM28.0003 2.66699H18.667C18.3134 2.66699 17.9742 2.80747 17.7242 3.05752C17.4741 3.30756 17.3337 3.6467 17.3337 4.00033V13.3337C17.3337 13.6873 17.4741 14.0264 17.7242 14.2765C17.9742 14.5265 18.3134 14.667 18.667 14.667H28.0003C28.3539 14.667 28.6931 14.5265 28.9431 14.2765C29.1932 14.0264 29.3337 13.6873 29.3337 13.3337V4.00033C29.3337 3.6467 29.1932 3.30756 28.9431 3.05752C28.6931 2.80747 28.3539 2.66699 28.0003 2.66699ZM26.667 12.0003H20.0003V5.33366H26.667V12.0003ZM28.0003 17.3337H18.667C18.3134 17.3337 17.9742 17.4741 17.7242 17.7242C17.4741 17.9742 17.3337 18.3134 17.3337 18.667V28.0003C17.3337 28.3539 17.4741 28.6931 17.7242 28.9431C17.9742 29.1932 18.3134 29.3337 18.667 29.3337H28.0003C28.3539 29.3337 28.6931 29.1932 28.9431 28.9431C29.1932 28.6931 29.3337 28.3539 29.3337 28.0003V18.667C29.3337 18.3134 29.1932 17.9742 28.9431 17.7242C28.6931 17.4741 28.3539 17.3337 28.0003 17.3337ZM26.667 26.667H20.0003V20.0003H26.667V26.667ZM13.3337 2.66699H4.00033C3.6467 2.66699 3.30756 2.80747 3.05752 3.05752C2.80747 3.30756 2.66699 3.6467 2.66699 4.00033V13.3337C2.66699 13.6873 2.80747 14.0264 3.05752 14.2765C3.30756 14.5265 3.6467 14.667 4.00033 14.667H13.3337C13.6873 14.667 14.0264 14.5265 14.2765 14.2765C14.5265 14.0264 14.667 13.6873 14.667 13.3337V4.00033C14.667 3.6467 14.5265 3.30756 14.2765 3.05752C14.0264 2.80747 13.6873 2.66699 13.3337 2.66699ZM12.0003 12.0003H5.33366V5.33366H12.0003V12.0003Z" fill="#F79009"/>
						</svg>
					`)}`;

					// Рисуем текст тега количества (с отступом от иконки)
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'left';
					ctx.textBaseline = 'middle';

					ctx.fillText(goalsText, iconX + iconSize + iconPadding, countTagY + 2 + countTagHeight / 2);
				}

				// Логотип Delting справа в белой заливке
				// Логотип Delting справа в белой заливке
				const logoSize = 72;
				const logoX = width - 72 - logoSize;
				const logoY = height - 72 - 60;

				// Рисуем фон под логотип
				ctx.fillStyle = 'transparent';
				ctx.fillRect(logoX, logoY, logoSize, 60);

				// Загружаем и рисуем SVG
				const img = new Image();
				img.onload = function () {
					ctx.drawImage(img, logoX, logoY, logoSize, 60);

					// Конвертируем только после того, как логотип отрисовался
					const dataUrl = canvas.toDataURL('image/png');
					setImageUrl(dataUrl);
					setIsGenerating(false);
				};
				img.onerror = function () {
					// Даже если логотип не загрузился, сохраняем изображение
					const dataUrl = canvas.toDataURL('image/png');
					setImageUrl(dataUrl);
					setIsGenerating(false);
				};
				img.src = `data:image/svg+xml;base64,${btoa(`
					<svg width="72" height="60" viewBox="0 0 72 60" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M26.4004 7.2002C34.9651 7.20032 42.5768 11.2811 47.4004 17.6035L41.0947 21.2432C37.5727 17.0592 32.297 14.4005 26.4004 14.4004C15.7974 14.4004 7.20041 22.9961 7.2002 33.5996C7.2002 44.2033 15.7973 52.7998 26.4004 52.7998C37.0033 52.7996 45.5996 44.2032 45.5996 33.5996C45.5996 30.6181 44.9189 27.7959 43.7061 25.2783L49.9551 21.6699C51.7737 25.2531 52.7997 29.3064 52.7998 33.5996C52.7998 48.1799 40.9783 59.9998 26.4004 60C11.8223 60 0 48.1801 0 33.5996C0.000210204 19.0193 11.8224 7.2002 26.4004 7.2002ZM26.4004 24C28.7228 24.0001 30.8523 24.8255 32.5127 26.1982L26.0781 29.9141C24.9305 30.5769 24.5375 32.0446 25.2002 33.1924C25.863 34.3402 27.3307 34.733 28.4785 34.0703L35.3408 30.1074C35.7641 31.1901 36 32.367 36 33.5996C36 38.9016 31.7018 43.2 26.4004 43.2002C21.0988 43.2002 16.7998 38.9018 16.7998 33.5996C16.8 28.2976 21.099 24 26.4004 24Z" fill="white"/>
						<path d="M49.2605 22.0704L59.3763 26.3914C59.9552 26.6387 60.6168 26.599 61.162 26.2842L70.6882 20.7842L59.6529 16.0704L49.2605 22.0704Z" fill="white"/>
						<path d="M46.8605 17.9135L48.1763 6.99243C48.2516 6.36743 48.6168 5.81437 49.162 5.49961L58.6882 -0.000391197L57.2529 11.9135L46.8605 17.9135Z" fill="white"/>
					</svg>
				`)}`;

				// Конвертируем canvas в data URL
				const dataUrl = canvas.toDataURL('image/png');
				setImageUrl(dataUrl);
			} catch (error) {
				console.error('Ошибка при генерации OG изображения:', error);
			} finally {
				setIsGenerating(false);
			}
		};

		generateImage();
	}, [goal, list, width, height]);

	return {imageUrl, isGenerating};
};
