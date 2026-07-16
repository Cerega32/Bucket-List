import {shouldWatchSubscriptionExpiry} from '@/utils/subscription/getSubscriptionExpiryState';

const DAY_MS = 1000 * 60 * 60 * 24;
const MAX_TIMEOUT_MS = 7 * DAY_MS;
const BANNER_THRESHOLD_DAYS = [5, 1, 0];
const PROFILE_SYNC_AFTER_EXPIRY_MS = [0, 2 * 60 * 1000, 15 * 60 * 1000];
const PROFILE_SYNC_IF_ALREADY_EXPIRED_MS = [30 * 1000, 2 * 60 * 1000, 15 * 60 * 1000];

let timerIds: ReturnType<typeof setTimeout>[] = [];

interface SubscriptionExpiryHandlers {
	onBannerTick: () => void;
	isPremium: () => boolean;
	onSyncProfile: () => void;
}

let handlers: SubscriptionExpiryHandlers | null = null;

interface ScheduleSubscriptionExpiryTimersParams {
	isAuth: boolean;
	subscriptionType?: 'free' | 'premium';
	subscriptionExpiresAt?: string | null;
	subscriptionAutoRenew?: boolean;
	showExpiredBanner?: boolean;
}

export function registerSubscriptionExpiryHandlers(nextHandlers: SubscriptionExpiryHandlers): void {
	handlers = nextHandlers;
}

function clearSubscriptionExpiryTimers(): void {
	timerIds.forEach(clearTimeout);
	timerIds = [];
}

function scheduleAtAbsolute(whenMs: number, callback: () => void): void {
	const delay = whenMs - Date.now();
	if (delay <= 0) {
		callback();
		return;
	}

	const safeDelay = Math.min(delay, MAX_TIMEOUT_MS);
	timerIds.push(
		setTimeout(() => {
			if (Date.now() >= whenMs) {
				callback();
				return;
			}
			scheduleAtAbsolute(whenMs, callback);
		}, safeDelay)
	);
}

/** Абсолютные таймеры на пороги баннера и момент истечения — без polling */
export function scheduleSubscriptionExpiryTimers(params: ScheduleSubscriptionExpiryTimersParams): void {
	clearSubscriptionExpiryTimers();

	if (!handlers || !shouldWatchSubscriptionExpiry(params) || !params.subscriptionExpiresAt) {
		return;
	}

	const {onBannerTick, isPremium, onSyncProfile} = handlers;
	const expiryMs = new Date(params.subscriptionExpiresAt).getTime();
	const now = Date.now();

	BANNER_THRESHOLD_DAYS.forEach((days) => {
		const thresholdMs = expiryMs - days * DAY_MS;
		if (thresholdMs <= now) {
			return;
		}

		scheduleAtAbsolute(thresholdMs, onBannerTick);
	});

	if (expiryMs <= now) {
		onBannerTick();
	}

	const profileSyncOffsets = expiryMs > now ? PROFILE_SYNC_AFTER_EXPIRY_MS : PROFILE_SYNC_IF_ALREADY_EXPIRED_MS;
	const profileSyncBaseMs = expiryMs > now ? expiryMs : now;

	profileSyncOffsets.forEach((offsetMs) => {
		const syncAt = profileSyncBaseMs + offsetMs;
		if (syncAt <= now) {
			return;
		}

		scheduleAtAbsolute(syncAt, () => {
			if (!isPremium()) {
				return;
			}
			onSyncProfile();
		});
	});
}

export function clearSubscriptionExpiryTimersOnLogout(): void {
	clearSubscriptionExpiryTimers();
}
