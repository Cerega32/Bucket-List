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

	const stub: YandexMetrikaFn = function stub(...args: unknown[]) {
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
