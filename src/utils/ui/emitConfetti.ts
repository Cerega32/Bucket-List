const CONFETTI_COLORS = [
	'rgb(168 85 247)', // фиолетовый
	'rgb(34 197 94)', // зеленый
	'rgb(250 204 21)', // желтый
	'rgb(56 189 248)', // голубой
	'rgb(244 114 182)', // розовый
];

const rand = (min: number, max: number): number => Math.random() * (max - min) + min;

export const emitConfettiFromElement = (element: HTMLElement, pieces = 24): void => {
	if (typeof window === 'undefined' || !element) return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const rect = element.getBoundingClientRect();
	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;

	const layer = document.createElement('div');
	layer.style.position = 'fixed';
	layer.style.inset = '0';
	layer.style.pointerEvents = 'none';
	layer.style.zIndex = '9999';
	layer.style.overflow = 'visible';
	document.body.appendChild(layer);

	for (let i = 0; i < pieces; i += 1) {
		const particle = document.createElement('span');
		const size = rand(5, 10);
		const angle = (Math.PI * 2 * i) / pieces + rand(-0.2, 0.2);
		const distance = rand(48, 118);
		const dx = Math.cos(angle) * distance;
		const dy = Math.sin(angle) * distance;
		const driftX = rand(-10, 10);
		const gravity = rand(28, 64);
		const rotate = rand(120, 420);

		particle.style.position = 'fixed';
		particle.style.left = `${centerX}px`;
		particle.style.top = `${centerY}px`;
		particle.style.width = `${size}px`;
		particle.style.height = `${Math.max(3, size * 0.55)}px`;
		particle.style.borderRadius = '2px';
		particle.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
		particle.style.transform = 'translate(-50%, -50%)';
		layer.appendChild(particle);

		particle.animate(
			[
				{transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1},
				{
					transform: `translate(calc(-50% + ${dx + driftX * 0.3}px), calc(-50% + ${dy * 0.5}px)) rotate(${rotate * 0.45}deg)`,
					opacity: 1,
					offset: 0.55,
				},
				{
					transform: `translate(calc(-50% + ${dx + driftX}px), calc(-50% + ${dy + gravity}px)) rotate(${rotate}deg)`,
					opacity: 0,
				},
			],
			{
				duration: rand(1250, 1850),
				easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
				fill: 'forwards',
			}
		).onfinish = () => {
			particle.remove();
			if (!layer.hasChildNodes()) {
				layer.remove();
			}
		};
	}
};
