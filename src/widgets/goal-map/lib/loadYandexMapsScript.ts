declare global {
	interface Window {
		ymaps: any;
	}
}

export const YANDEX_MAPS_LOAD_TIMEOUT_MS = 15000;

export const YANDEX_MAP_LOAD_ERROR_MESSAGE =
	'Не удалось загрузить Яндекс.Карты. Часто это связано с VPN или блокировкой доступа к сервисам Яндекса. ' +
	'Попробуйте отключить VPN и обновить страницу.';

const YANDEX_MAPS_SCRIPT_SELECTOR = 'script[src^="https://api-maps.yandex.ru/2.1/"]';

export const loadYandexMapsScript = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		const onReady = () => {
			if (window.ymaps) {
				window.ymaps.ready(() => resolve());
				return;
			}
			reject(new Error('Yandex Maps failed to load'));
		};

		if (window.ymaps && window.ymaps.Map) {
			onReady();
			return;
		}

		const existingScript = document.querySelector(YANDEX_MAPS_SCRIPT_SELECTOR);
		if (existingScript) {
			existingScript.addEventListener('load', onReady, {once: true});
			existingScript.addEventListener('error', () => reject(new Error('Yandex Maps script error')), {once: true});
			return;
		}

		const script = document.createElement('script');
		script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env['NEXT_PUBLIC_YANDEX_API_KEY']}&lang=ru_RU`;
		script.async = true;
		script.onload = onReady;
		script.onerror = () => reject(new Error('Yandex Maps script error'));
		document.head.appendChild(script);
	});
};
