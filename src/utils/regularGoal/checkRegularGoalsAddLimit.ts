import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {IUserInfo} from '@/typings/user';

import {isPremiumSubscriptionActive} from './isPremiumSubscriptionActive';
import {notifyRegularGoalsPremiumLimitReached, REGULAR_GOALS_PREMIUM_LIMIT_TEXT} from './regularGoalsPremiumLimitContent';

export {isPremiumSubscriptionActive} from './isPremiumSubscriptionActive';

export type RegularGoalsLimitBlockAction = 'premium' | 'email';

export const REGULAR_GOALS_PREMIUM_LIMIT_CODE = 'regular_goals_premium_limit_reached';
export const REGULAR_GOALS_FREE_LIMIT_CODE = 'regular_goals_limit_reached';

export const isRegularGoalsLimitApiError = (code: unknown): boolean =>
	code === REGULAR_GOALS_PREMIUM_LIMIT_CODE || code === REGULAR_GOALS_FREE_LIMIT_CODE;

/** Показать toast лимита вместо общей ошибки API (403). Возвращает true, если код обработан. */
export const notifyRegularGoalsLimitApiError = (code: unknown): boolean => {
	if (code === REGULAR_GOALS_PREMIUM_LIMIT_CODE) {
		notifyRegularGoalsPremiumLimitReached();
		return true;
	}

	if (code === REGULAR_GOALS_FREE_LIMIT_CODE) {
		NotificationStore.addNotification({
			type: 'warning',
			title: 'Лимит достигнут',
			message: 'Достигнут лимит регулярных целей на бесплатном плане. Оформите Premium, чтобы добавлять больше.',
		});
		return true;
	}

	return false;
};

export interface RegularGoalsAddLimitState {
	allowed: boolean;
	action?: RegularGoalsLimitBlockAction;
	message?: string;
}

export const getRegularGoalsAddLimitState = (userSelf?: IUserInfo): RegularGoalsAddLimitState => {
	const user = userSelf ?? UserStore.userSelf;
	const maxRegularGoals = user.limits?.maxRegularGoals ?? 3;
	const isPremium = isPremiumSubscriptionActive(user);
	const regularGoalsCount = user.counts?.regularGoals ?? 0;

	if (regularGoalsCount < maxRegularGoals) {
		return {allowed: true};
	}

	if (isPremium) {
		return {
			allowed: false,
			action: 'email',
			message: REGULAR_GOALS_PREMIUM_LIMIT_TEXT,
		};
	}

	return {
		allowed: false,
		action: 'premium',
		message: `Достигнут лимит регулярных целей (${maxRegularGoals}) на бесплатном плане. Оформите Premium, чтобы добавлять больше.`,
	};
};

export interface BlockRegularGoalsAddOptions {
	onPremium?: () => void;
	userSelf?: IUserInfo;
}

/** Возвращает true, если добавление регулярной цели нужно заблокировать */
export const blockRegularGoalsAddIfLimitReached = (options?: BlockRegularGoalsAddOptions): boolean => {
	const state = getRegularGoalsAddLimitState(options?.userSelf);

	if (state.allowed) {
		return false;
	}

	if (state.action === 'email') {
		notifyRegularGoalsPremiumLimitReached();
	} else {
		options?.onPremium?.();
	}

	return true;
};
