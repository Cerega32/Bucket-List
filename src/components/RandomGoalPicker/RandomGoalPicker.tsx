import {FC, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {IShortGoal} from '@/typings/goal';

import {Button} from '../Button/Button';
import {Title} from '../Title/Title';

import './random-goal-picker.scss';

interface RandomGoalPickerProps {
	goals: IShortGoal[];
	onClose: () => void;
}

type Particle = {
	sx: number; // start x
	sy: number; // start y
	tx: number; // target x
	ty: number; // target y
	color: string;
	size: number;
	delay: number; // ms
};

export const RandomGoalPicker: FC<RandomGoalPickerProps> = ({goals, onClose}) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const animatingRef = useRef(false);
	const navigate = useNavigate();

	const [isAnimating, setIsAnimating] = useState(false);
	const [selectedGoal, setSelectedGoal] = useState<IShortGoal | null>(null);
	const [block, element] = useBem('random-goal-picker');

	// Константы настройки анимации — можно подстроить
	const WIDTH = 400;
	const HEIGHT = 300;
	const DURATION = 1200; // ms (длительность движения частиц)
	const MAX_PARTICLES = 2000; // ограничение по количеству частиц
	const SPREAD = 200; // насколько разбросаны стартовые позиции

	const items = goals.filter((g) => !g.completedByUser);
	const itemsCount = items.length;

	useEffect(() => {
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	// Рисуем знак вопроса, когда цель не выбрана
	useEffect(() => {
		if (!selectedGoal && !isAnimating && canvasRef.current) {
			const canvas = canvasRef.current;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			const dpr = window.devicePixelRatio || 1;
			canvas.width = Math.floor(WIDTH * dpr);
			canvas.height = Math.floor(HEIGHT * dpr);
			canvas.style.width = `${WIDTH}px`;
			canvas.style.height = `${HEIGHT}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			ctx.clearRect(0, 0, WIDTH, HEIGHT);

			// Рисуем верхнюю часть знака вопроса (дугу) без точки
			ctx.fillStyle = '#94a3b8'; // цвет вопроса
			ctx.font = 'bold 120px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			// Рисуем ? без точки (рисуем вверх со смещением)
			ctx.save();
			ctx.beginPath();
			ctx.rect(0, 0, WIDTH, HEIGHT / 2 + 40);
			ctx.clip();
			ctx.fillText('?', WIDTH / 2, HEIGHT / 2 - 15);
			ctx.restore();

			// Загружаем и рисуем логотип вместо точки
			const logo = new Image();
			logo.onload = () => {
				const logoSize = 30;
				ctx.drawImage(logo, WIDTH / 2 - logoSize / 2, HEIGHT / 2 + 45, logoSize, logoSize * (logo.height / logo.width));
			};
			logo.src = '/logo.svg';
		}
	}, [selectedGoal, isAnimating]);

	const loadImage = (src: string): Promise<HTMLImageElement> => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'Anonymous';
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	};

	const clearCanvas = (ctx: CanvasRenderingContext2D) => {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	};

	const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

	const createFallbackParticles = (): Particle[] => {
		// создаём простые частички одного цвета, если нет изображения
		const particles: Particle[] = [];
		const color = '#cbd5e1';
		const approx = 800;
		for (let i = 0; i < Math.min(approx, MAX_PARTICLES); i++) {
			const tx = Math.random() * WIDTH;
			const ty = Math.random() * HEIGHT;
			const sx = WIDTH / 2 + (Math.random() - 0.5) * SPREAD;
			const sy = HEIGHT / 2 + (Math.random() - 0.5) * SPREAD;
			const size = 1 + Math.random() * 2;
			const delay = Math.random() * 200;
			particles.push({sx, sy, tx, ty, color, size, delay});
		}
		return particles;
	};

	const createParticlesFromImage = (img: HTMLImageElement, ctx: CanvasRenderingContext2D, dpr: number): Particle[] => {
		// offscreen canvas to get pixel data
		const oc = document.createElement('canvas');
		const ow = Math.floor(WIDTH * dpr);
		const oh = Math.floor(HEIGHT * dpr);
		oc.width = ow;
		oc.height = oh;
		const octx = oc.getContext('2d');
		if (!octx) return [];

		// Fit image into canvas while keeping aspect ratio
		const aspect = img.width / img.height;
		let drawW = ow;
		let drawH = Math.round(drawW / aspect);
		if (drawH > oh) {
			drawH = oh;
			drawW = Math.round(drawH * aspect);
		}

		const dx = Math.floor((ow - drawW) / 2) + 3;
		const dy = Math.floor((oh - drawH) / 2) + 3.5;
		octx.clearRect(0, 0, ow, oh);
		octx.drawImage(img, dx, dy, drawW, drawH);

		// dynamic sampling step: fewer particles for large images
		const approxCount = 1200; // target particles
		const totalPixels = drawW * drawH;
		const sampleStep = Math.max(1, Math.floor(Math.sqrt(totalPixels / approxCount)));

		const particles: Particle[] = [];

		const imgData = octx.getImageData(0, 0, ow, oh).data;

		for (let y = 0; y < oh; y += sampleStep) {
			for (let x = 0; x < ow; x += sampleStep) {
				const idx = (y * ow + x) * 4;
				const r = imgData[idx];
				const g = imgData[idx + 1];
				const b = imgData[idx + 2];
				const a = imgData[idx + 3];

				// прозрачно — пропускаем
				if (a >= 50) {
					const tx = x / dpr; // целевая позиция в CSS px
					const ty = y / dpr;

					const sx = WIDTH / 2 + (Math.random() - 0.5) * SPREAD;
					const sy = HEIGHT / 2 + (Math.random() - 0.5) * SPREAD;

					const color = `rgba(${r},${g},${b},${a / 255})`;
					const size = Math.max(1, sampleStep / dpr);
					const delay = Math.random() * 200; // ms

					particles.push({sx, sy, tx, ty, color, size, delay});

					if (particles.length >= MAX_PARTICLES) break;
				}
			}
			if (particles.length >= MAX_PARTICLES) break;
		}

		return particles;
	};

	const animateParticles = (particles: Particle[], img: HTMLImageElement | null, canvas: HTMLCanvasElement, duration = DURATION) => {
		return new Promise<void>((resolve) => {
			const dpr = window.devicePixelRatio || 1;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve();
				return;
			}

			// Resize canvas for DPR
			// eslint-disable-next-line no-param-reassign
			canvas.width = Math.floor(WIDTH * dpr);
			// eslint-disable-next-line no-param-reassign
			canvas.height = Math.floor(HEIGHT * dpr);
			// eslint-disable-next-line no-param-reassign
			canvas.style.width = `${WIDTH}px`;
			// eslint-disable-next-line no-param-reassign
			canvas.style.height = `${HEIGHT}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			const start = performance.now();

			const tick = (time: number) => {
				const t = time - start;
				clearCanvas(ctx);

				let completed = 0;

				for (let i = 0; i < particles.length; i++) {
					const p = particles[i];
					const localT = Math.min(Math.max((t - p.delay) / duration, 0), 1);
					const eased = easeOutCubic(localT);

					const x = p.sx + (p.tx - p.sx) * eased;
					const y = p.sy + (p.ty - p.sy) * eased;

					ctx.beginPath();
					ctx.fillStyle = p.color;
					ctx.arc(x, y, p.size, 0, Math.PI * 2);
					ctx.fill();

					if (localT >= 1) completed++;
				}

				if (completed >= particles.length) {
					// Финальный рендер — чёткое изображение
					if (img) {
						// draw image centered and fitted
						const aspect = img.width / img.height;
						let drawW = WIDTH;
						let drawH = Math.round(drawW / aspect);
						if (drawH > HEIGHT) {
							drawH = HEIGHT;
							drawW = Math.round(drawH * aspect);
						}
						const dx = Math.floor((WIDTH - drawW) / 2);
						const dy = Math.floor((HEIGHT - drawH) / 2);
						ctx.drawImage(img, dx, dy, drawW, drawH);
					}
					resolve();
					return;
				}

				rafRef.current = requestAnimationFrame(tick);
			};

			rafRef.current = requestAnimationFrame(tick);
		});
	};

	const spin = async () => {
		if (!itemsCount || animatingRef.current) return;
		animatingRef.current = true;
		setIsAnimating(true);

		const randomIndex = Math.floor(Math.random() * itemsCount);
		const target = items[randomIndex];

		const canvas = canvasRef.current;
		if (!canvas) {
			animatingRef.current = false;
			setIsAnimating(false);
			return;
		}

		let img: HTMLImageElement | null = null;
		try {
			if (target.image) img = await loadImage(target.image);
		} catch (e) {
			// если не удалось загрузить изображение — оставляем img = null, particles будут из placeholder цвета
			img = null;
		}

		try {
			const dpr = window.devicePixelRatio || 1;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('no-canvas');

			// подготовка частиц
			const particles = img ? createParticlesFromImage(img, ctx, dpr) : createFallbackParticles();

			await animateParticles(particles, img, canvas);

			// по завершении показываем выбранную цель
			setSelectedGoal(target);
		} catch (err) {
			// при ошибке просто сразу показываем цель без анимации
			setSelectedGoal(target);
		}

		setIsAnimating(false);
		animatingRef.current = false;
	};

	const handleGoToGoal = () => {
		if (selectedGoal) {
			onClose();
			navigate(`/goals/${selectedGoal.code}/`);
		}
	};

	return (
		<section className={block()}>
			<Title tag="h2">Случайная цель</Title>

			<div
				style={{
					width: WIDTH,
					height: HEIGHT,
					margin: '24px auto',
					position: 'relative',
					borderRadius: 12,
					overflow: 'hidden',
				}}
			>
				<canvas ref={canvasRef} className={element('canvas')} />
			</div>

			<div className={element('details')}>
				<div className={element('selected-goal', {disabled: !selectedGoal && !!itemsCount})}>
					<p>{itemsCount === 0 ? 'Вы уже выполнили все цели в этом списке' : 'Ваша цель:'}</p>
					<p className={element('selected-goal-title')}>{isAnimating ? '...' : selectedGoal?.title}</p>
				</div>
				<div className={element('buttons')}>
					{selectedGoal && (
						<Button
							theme="blue-light"
							disabled={!selectedGoal}
							onClick={handleGoToGoal}
							className={element('button-to-goal', {disabled: !selectedGoal || isAnimating})}
						>
							Перейти к цели
						</Button>
					)}
					<Button className={element('button-select')} onClick={spin} disabled={isAnimating || itemsCount === 0} theme="blue">
						{selectedGoal ? 'Выбрать другую' : 'Выбрать'}
					</Button>
				</div>
			</div>
		</section>
	);
};
