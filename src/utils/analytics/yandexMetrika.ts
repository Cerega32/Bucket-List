type YandexMetrikaFn = {
	(...args: unknown[]): void;
	a?: unknown[][];
	l?: number;
};

declare global {
	interface Window {
		ym?: YandexMetrikaFn;
	}
}

export const initYandexMetrika = (counterId: string): void => {
	if (!counterId || typeof window === 'undefined' || typeof document === 'undefined') {
		return;
	}

	const numericId = Number(counterId);
	if (!Number.isFinite(numericId)) {
		return;
	}

	const scriptUrl = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;

	for (let j = 0; j < document.scripts.length; j += 1) {
		if (document.scripts[j].src === scriptUrl) {
			return;
		}
	}

	const stub: YandexMetrikaFn = (...args: unknown[]) => {
		(stub.a = stub.a || []).push(args);
	};
	stub.l = Number(new Date());
	window.ym = window.ym || stub;

	const script = document.createElement('script');
	script.async = true;
	script.src = scriptUrl;
	const firstScript = document.getElementsByTagName('script')[0];
	firstScript?.parentNode?.insertBefore(script, firstScript);

	window.ym(numericId, 'init', {
		ssr: true,
		webvisor: true,
		clickmap: true,
		ecommerce: 'dataLayer',
		referrer: document.referrer,
		url: window.location.href,
		accurateTrackBounce: true,
		trackLinks: true,
	});
};

export const METRIKA_GOALS = {
	startPathClick: 'start_path_click',
	headerRegisterClick: 'header_register_click',
	registrationSuccess: 'registration_success',
} as const;

export type MetrikaGoalId = (typeof METRIKA_GOALS)[keyof typeof METRIKA_GOALS];

/** Sends a Metrika goal. No-op if Metrika is not loaded (no cookie consent / not prod). */
export const reachGoal = (goalId: MetrikaGoalId | string): void => {
	if (typeof window === 'undefined' || !window.ym) {
		return;
	}

	const counterId = Number(import.meta.env['VITE_YANDEX_METRIKA_ID'] ?? '');
	if (!Number.isFinite(counterId) || counterId <= 0) {
		return;
	}

	window.ym(counterId, 'reachGoal', goalId);
};
