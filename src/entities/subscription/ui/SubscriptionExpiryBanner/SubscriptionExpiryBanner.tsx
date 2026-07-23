import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {
	formatExpiryDate,
	getSubscriptionBannerState,
	SUBSCRIPTION_BANNER_DISMISS_KEYS,
	SUBSCRIPTION_SHOW_EXPIRED_KEY,
	SubscriptionBannerState,
} from '@/entities/subscription/lib/getSubscriptionExpiryState';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Button} from '@/shared/ui/Button/Button';
import {Svg} from '@/shared/ui/Svg/Svg';

import '@/entities/subscription/ui/SubscriptionExpiryBanner/subscription-expiry-banner.scss';

const BANNER_CONTENT: Record<
	Exclude<SubscriptionBannerState, 'none'>,
	{title: string; getMessage: (expiresAt?: string | null) => string; actionText: string; tone: 'warning' | 'danger'}
> = {
	expiring_5d: {
		title: 'Premium скоро закончится',
		getMessage: (expiresAt) =>
			expiresAt
				? `Подписка действует до ${formatExpiryDate(expiresAt)}. Продлите её, чтобы сохранить все преимущества.`
				: 'Подписка скоро закончится. Продлите её, чтобы сохранить все преимущества.',
		actionText: 'Продлить',
		tone: 'warning',
	},
	expiring_1d: {
		title: 'Premium заканчивается завтра',
		getMessage: (expiresAt) =>
			expiresAt
				? `Завтра, ${formatExpiryDate(expiresAt)}, заканчивается ваша подписка Premium.`
				: 'Завтра заканчивается ваша подписка Premium.',
		actionText: 'Продлить сейчас',
		tone: 'danger',
	},
	expired: {
		title: 'Premium закончился',
		getMessage: () => 'Ваша подписка Premium истекла. Продлите её, чтобы снова получить доступ ко всем премиум-функциям.',
		actionText: 'Продлить подписку',
		tone: 'danger',
	},
};

const isBannerDismissed = (state: SubscriptionBannerState): boolean => {
	if (state === 'none') {
		return true;
	}
	return Boolean(Cookies.get(SUBSCRIPTION_BANNER_DISMISS_KEYS[state]));
};

export const SubscriptionExpiryBanner: FC = observer(() => {
	const [block, element] = useBem('subscription-expiry-banner');
	const navigate = useNavigate();
	const [isVisible, setIsVisible] = useState(false);
	const [isCompactHeader, setIsCompactHeader] = useState(false);
	const {isAuth, emailConfirmed, userSelf, subscriptionExpiredBanner, subscriptionExpiryTick} = UserStore;
	const showExpiredBanner = subscriptionExpiredBanner || Boolean(Cookies.get(SUBSCRIPTION_SHOW_EXPIRED_KEY));

	const bannerState = useMemo(
		() =>
			getSubscriptionBannerState({
				isAuth,
				subscriptionType: userSelf.subscriptionType,
				subscriptionExpiresAt: userSelf.subscriptionExpiresAt,
				subscriptionAutoRenew: userSelf.subscriptionAutoRenew,
				showExpiredBanner,
			}),
		[
			isAuth,
			userSelf.subscriptionType,
			userSelf.subscriptionExpiresAt,
			userSelf.subscriptionAutoRenew,
			subscriptionExpiredBanner,
			showExpiredBanner,
			subscriptionExpiryTick,
		]
	);

	useEffect(() => {
		if (bannerState !== 'none' && !isBannerDismissed(bannerState)) {
			const timer = setTimeout(() => {
				setIsVisible(true);
			}, 800);
			return () => clearTimeout(timer);
		}
		setIsVisible(false);
		return undefined;
	}, [bannerState]);

	useEffect(() => {
		const handleScroll = () => {
			setIsCompactHeader(window.scrollY > 0);
		};

		handleScroll();
		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	const handleDismiss = () => {
		if (bannerState === 'none') {
			return;
		}

		const dismissDays = bannerState === 'expired' ? 7 : 1;
		Cookies.set(SUBSCRIPTION_BANNER_DISMISS_KEYS[bannerState], '1', {expires: dismissDays});

		if (bannerState === 'expired') {
			Cookies.remove(SUBSCRIPTION_SHOW_EXPIRED_KEY);
			UserStore.setSubscriptionExpiredBanner(false);
		}

		setIsVisible(false);
	};

	const handleAction = () => {
		handleDismiss();
		navigate('/user/self/subs');
	};

	if (!isVisible || bannerState === 'none') {
		return null;
	}

	const content = BANNER_CONTENT[bannerState];
	const showBelowEmailBanner = isAuth && !emailConfirmed;

	return (
		<div className={block({compact: isCompactHeader, tone: content.tone, 'with-email-banner': showBelowEmailBanner})}>
			<div className={element('content')}>
				<div className={element('icon')}>
					<Svg icon="award" />
				</div>
				<div className={element('text')}>
					<p className={element('message')}>
						<strong>{content.title}</strong>
						<br />
						{content.getMessage(userSelf.subscriptionExpiresAt)}
					</p>
				</div>
				<div className={element('actions')}>
					<Button theme="blue" className={element('btn')} onClick={handleAction} typeBtn="button">
						{content.actionText}
					</Button>
					<button type="button" className={element('close')} onClick={handleDismiss} aria-label="Закрыть">
						<Svg icon="cross" />
					</button>
				</div>
			</div>
		</div>
	);
});
