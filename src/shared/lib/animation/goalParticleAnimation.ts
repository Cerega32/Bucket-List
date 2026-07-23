export type GoalParticle = {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	color: string;
	size: number;
	delay: number;
};

export interface GoalParticleAnimationOptions {
	width: number;
	height: number;
	duration?: number;
	maxParticles?: number;
	spread?: number;
	approxCount?: number;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export const loadGoalParticleImage = (src: string): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
};

export const createFallbackGoalParticles = (options: GoalParticleAnimationOptions): GoalParticle[] => {
	const {width, height, maxParticles = 800, spread = 120, approxCount = 400} = options;
	const particles: GoalParticle[] = [];
	const color = '#cbd5e1';

	for (let i = 0; i < Math.min(approxCount, maxParticles); i++) {
		const tx = Math.random() * width;
		const ty = Math.random() * height;
		const sx = width / 2 + (Math.random() - 0.5) * spread;
		const sy = height / 2 + (Math.random() - 0.5) * spread;
		const size = 1 + Math.random() * 2;
		const delay = Math.random() * 200;
		particles.push({sx, sy, tx, ty, color, size, delay});
	}

	return particles;
};

export const createGoalParticlesFromImage = (img: HTMLImageElement, options: GoalParticleAnimationOptions): GoalParticle[] => {
	const {width, height, maxParticles = 800, spread = 120, approxCount = 400} = options;
	const dpr = window.devicePixelRatio || 1;
	const ow = Math.floor(width * dpr);
	const oh = Math.floor(height * dpr);
	const oc = document.createElement('canvas');
	oc.width = ow;
	oc.height = oh;
	const octx = oc.getContext('2d');
	if (!octx) {
		return [];
	}

	const aspect = img.width / img.height;
	let drawW = ow;
	let drawH = Math.round(drawW / aspect);
	if (drawH > oh) {
		drawH = oh;
		drawW = Math.round(drawH * aspect);
	}

	const dx = Math.floor((ow - drawW) / 2);
	const dy = Math.floor((oh - drawH) / 2);
	octx.clearRect(0, 0, ow, oh);
	octx.drawImage(img, dx, dy, drawW, drawH);

	const totalPixels = drawW * drawH;
	const sampleStep = Math.max(1, Math.floor(Math.sqrt(totalPixels / approxCount)));
	const imgData = octx.getImageData(0, 0, ow, oh).data;
	const particles: GoalParticle[] = [];

	for (let y = 0; y < oh; y += sampleStep) {
		for (let x = 0; x < ow; x += sampleStep) {
			const idx = (y * ow + x) * 4;
			const r = imgData[idx];
			const g = imgData[idx + 1];
			const b = imgData[idx + 2];
			const a = imgData[idx + 3];

			if (a >= 50) {
				const tx = x / dpr;
				const ty = y / dpr;
				const sx = width / 2 + (Math.random() - 0.5) * spread;
				const sy = height / 2 + (Math.random() - 0.5) * spread;
				const color = `rgba(${r},${g},${b},${a / 255})`;
				const size = Math.max(1, sampleStep / dpr);
				const delay = Math.random() * 200;
				particles.push({sx, sy, tx, ty, color, size, delay});

				if (particles.length >= maxParticles) {
					break;
				}
			}
		}
		if (particles.length >= maxParticles) {
			break;
		}
	}

	return particles;
};

export const animateGoalParticles = (
	particles: GoalParticle[],
	img: HTMLImageElement | null,
	canvas: HTMLCanvasElement,
	options: GoalParticleAnimationOptions
): Promise<void> => {
	const {width, height, duration = 900} = options;

	return new Promise((resolve) => {
		const dpr = window.devicePixelRatio || 1;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			resolve();
			return;
		}

		const canvasEl = canvas;
		canvasEl.width = Math.floor(width * dpr);
		canvasEl.height = Math.floor(height * dpr);
		canvasEl.style.width = `${width}px`;
		canvasEl.style.height = `${height}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const start = performance.now();

		const tick = (time: number) => {
			const t = time - start;
			ctx.clearRect(0, 0, width, height);

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

				if (localT >= 1) {
					completed++;
				}
			}

			if (completed >= particles.length) {
				if (img) {
					const aspect = img.width / img.height;
					let drawW = width;
					let drawH = Math.round(drawW / aspect);
					if (drawH > height) {
						drawH = height;
						drawW = Math.round(drawH * aspect);
					}
					const dx = Math.floor((width - drawW) / 2);
					const dy = Math.floor((height - drawH) / 2);
					ctx.drawImage(img, dx, dy, drawW, drawH);
				}
				resolve();
				return;
			}

			requestAnimationFrame(tick);
		};

		requestAnimationFrame(tick);
	});
};

export const revealGoalWithParticles = async (
	canvas: HTMLCanvasElement,
	imageSrc: string | null | undefined,
	options: GoalParticleAnimationOptions
): Promise<void> => {
	let img: HTMLImageElement | null = null;

	if (imageSrc) {
		try {
			img = await loadGoalParticleImage(imageSrc);
		} catch {
			img = null;
		}
	}

	const particles = img ? createGoalParticlesFromImage(img, options) : createFallbackGoalParticles(options);

	await animateGoalParticles(particles, img, canvas, options);
};
