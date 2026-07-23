import {IUserInfo} from '@/entities/user/model/types';

/** Premium активен: API отдаёт subscriptionExpiresAt только при живой подписке */
export const isPremiumSubscriptionActive = (user: IUserInfo): boolean =>
	user.subscriptionType === 'premium' && !!user.subscriptionExpiresAt;
