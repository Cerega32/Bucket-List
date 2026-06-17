import {initYandexMetrika} from '@/utils/analytics/yandexMetrika';

export const COOKIE_CONSENT_KEY = 'cookie_consent';

export type CookieConsentValue = 'accepted' | 'rejected';

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

export const initAnalyticsIfConsented = (): void => {
	if (!import.meta.env.PROD || getCookieConsent() !== 'accepted') {
		return;
	}

	initYandexMetrika(import.meta.env['VITE_YANDEX_METRIKA_ID'] ?? '');
};
