export type SubscriptionBannerState = 'none' | 'expiring_5d' | 'expiring_1d' | 'expired';

export const SUBSCRIPTION_BANNER_DISMISS_KEYS: Record<Exclude<SubscriptionBannerState, 'none'>, string> = {
	expiring_5d: 'subscription_banner_dismissed_5d',
	expiring_1d: 'subscription_banner_dismissed_1d',
	expired: 'subscription_expired_banner_dismissed',
};

export const SUBSCRIPTION_SHOW_EXPIRED_KEY = 'subscription_show_expired_banner';

export function getDaysUntilExpiry(expiresAt: string): number {
	const expiry = new Date(expiresAt);
	const now = new Date();
	const diffMs = expiry.getTime() - now.getTime();
	return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** Premium можно продлить вручную, когда до окончания осталось не больше days дней */
export function isWithinEarlyRenewalWindow(expiresAt: string | null, days = 7): boolean {
	if (!expiresAt) {
		return false;
	}

	const daysLeft = getDaysUntilExpiry(expiresAt);
	return daysLeft > 0 && daysLeft <= days;
}

export function formatExpiryDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

interface GetSubscriptionBannerStateParams {
	isAuth: boolean;
	subscriptionType?: 'free' | 'premium';
	subscriptionExpiresAt?: string | null;
	subscriptionAutoRenew?: boolean;
	showExpiredBanner?: boolean;
}

export function getSubscriptionBannerState(params: GetSubscriptionBannerStateParams): SubscriptionBannerState {
	const {isAuth, subscriptionType, subscriptionExpiresAt, subscriptionAutoRenew, showExpiredBanner} = params;

	if (!isAuth) {
		return 'none';
	}

	if (showExpiredBanner && subscriptionType !== 'premium') {
		return 'expired';
	}

	if (subscriptionType !== 'premium' || !subscriptionExpiresAt || subscriptionAutoRenew) {
		return 'none';
	}

	const daysLeft = getDaysUntilExpiry(subscriptionExpiresAt);

	if (daysLeft <= 0) {
		return 'expired';
	}

	if (daysLeft <= 1) {
		return 'expiring_1d';
	}

	if (daysLeft <= 5) {
		return 'expiring_5d';
	}

	return 'none';
}
