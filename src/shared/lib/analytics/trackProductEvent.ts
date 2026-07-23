import {postAnalyticsEvent} from '@/shared/api/postAnalyticsEvent';

const ANALYTICS_SESSION_KEY = 'analytics_session_id';

export type ProductAnalyticsEventName = 'reg_open' | 'registration_success';

export type ProductAnalyticsSource = 'start_path' | 'header' | 'page' | 'about' | 'login_modal' | 'other';

const createSessionId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const getAnalyticsSessionId = (): string => {
	if (typeof window === 'undefined') {
		return '';
	}

	try {
		const existing = localStorage.getItem(ANALYTICS_SESSION_KEY);
		if (existing) {
			return existing;
		}
		const sessionId = createSessionId();
		localStorage.setItem(ANALYTICS_SESSION_KEY, sessionId);
		return sessionId;
	} catch {
		return createSessionId();
	}
};

/** First-party funnel event. Independent of Yandex Metrika / cookie consent. Failures are silent. */
export const trackProductEvent = (name: ProductAnalyticsEventName, source?: ProductAnalyticsSource): void => {
	postAnalyticsEvent({
		name,
		source: source ?? '',
		sessionId: getAnalyticsSessionId(),
	}).catch(() => undefined);
};
