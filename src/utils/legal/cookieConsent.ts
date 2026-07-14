import {initYandexMetrika} from '@/utils/analytics/yandexMetrika';

export const COOKIE_CONSENT_KEY = 'cookie_consent';
export const COOKIE_CONSENT_RESET_EVENT = 'cookie-consent-reset';

export type CookieConsentValue = 'accepted' | 'rejected';

const YANDEX_METRIKA_COOKIE_PREFIX = '_ym_';
const YANDEX_METRIKA_COOKIE_NAMES = ['yandexuid', 'yuidss', 'ymex'];

const getCookieDomains = (): string[] => {
	if (typeof window === 'undefined') {
		return [];
	}

	const {hostname} = window.location;
	const domains = [hostname];

	if (hostname.includes('.')) {
		domains.push(`.${hostname.split('.').slice(-2).join('.')}`);
	}

	return domains;
};

export const clearYandexMetrikaCookies = (): void => {
	if (typeof document === 'undefined') {
		return;
	}

	const cookieNames = new Set<string>(YANDEX_METRIKA_COOKIE_NAMES);
	document.cookie.split(';').forEach((cookiePart) => {
		const name = cookiePart.split('=')[0]?.trim();
		if (name && (name.startsWith(YANDEX_METRIKA_COOKIE_PREFIX) || YANDEX_METRIKA_COOKIE_NAMES.includes(name))) {
			cookieNames.add(name);
		}
	});

	const domains = getCookieDomains();
	cookieNames.forEach((name) => {
		domains.forEach((domain) => {
			document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
		});
		document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
	});
};

export const getCookieConsent = (): CookieConsentValue | null => {
	if (typeof window === 'undefined') {
		return null;
	}

	const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
	if (consent === 'accepted' || consent === 'rejected') {
		return consent;
	}

	return null;
};

export const setCookieConsent = (value: CookieConsentValue): void => {
	localStorage.setItem(COOKIE_CONSENT_KEY, value);
};

export const resetCookieConsent = (): void => {
	localStorage.removeItem(COOKIE_CONSENT_KEY);
	clearYandexMetrikaCookies();
	window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_RESET_EVENT));
};

export const initAnalyticsIfConsented = (): void => {
	if (!import.meta.env.PROD || getCookieConsent() !== 'accepted') {
		return;
	}

	initYandexMetrika(import.meta.env['VITE_YANDEX_METRIKA_ID'] ?? '');
};
