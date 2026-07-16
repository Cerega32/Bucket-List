import {observer} from 'mobx-react-lite';
import {FC, useCallback, useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import {createPayment, getUserSubscription, unlinkPaymentMethod} from '@/utils/api/subscription';
import {refreshHeaderGoalCounts} from '@/utils/refreshHeaderGoalCounts';
import {isWithinEarlyRenewalWindow} from '@/utils/subscription/getSubscriptionExpiryState';

import {CurrentSubscription} from './CurrentSubscription/CurrentSubscription';
import {PaymentReturnModal, PaymentReturnModalCloseStatus} from './PaymentReturnModal/PaymentReturnModal';
import {FREE_FEATURES, PREMIUM_FEATURES, SUBSCRIPTION_PERIODS} from './subscription-constants';
import {SubscriptionComparisonModal} from './SubscriptionComparisonModal/SubscriptionComparisonModal';
import {SubscriptionPayment} from './SubscriptionPayment/SubscriptionPayment';
import {SubscriptionPlanCard} from './SubscriptionPlanCard/SubscriptionPlanCard';
import './user-self-subscription.scss';
import {UserSelfSubscriptionSkeleton} from './UserSelfSubscriptionSkeleton';

export const UserSelfSubscription: FC = observer(() => {
	const [block, element] = useBem('user-self-subscription');
	const [searchParams, setSearchParams] = useSearchParams();
	const [isComparisonOpen, setIsComparisonOpen] = useState(false);
	const [returnPaymentId, setReturnPaymentId] = useState<string | null>(null);
	const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
	const [isCreatingPayment, setIsCreatingPayment] = useState(false);
	const [subscription, setSubscription] = useState<{
		type: 'free' | 'premium';
		expiresAt: string | null;
		isAutoRenew: boolean;
		hasSavedPaymentMethod: boolean;
	}>({
		type: 'free',
		expiresAt: null,
		isAutoRenew: false,
		hasSavedPaymentMethod: false,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isUnlinkingCard, setIsUnlinkingCard] = useState(false);

	const refreshSubscriptionSilently = useCallback(async () => {
		const response = await getUserSubscription();
		if (response.success && response.data) {
			setSubscription({
				type: response.data.subscriptionType,
				expiresAt: response.data.subscriptionExpiresAt,
				isAutoRenew: response.data.subscriptionAutoRenew,
				hasSavedPaymentMethod: response.data.hasSavedPaymentMethod,
			});
		}
	}, []);

	const loadSubscription = useCallback(async () => {
		setIsLoading(true);
		await refreshSubscriptionSilently();
		setIsLoading(false);
	}, [refreshSubscriptionSilently]);

	useEffect(() => {
		loadSubscription();
	}, [loadSubscription]);

	useEffect(() => {
		const paymentId = searchParams.get('payment_id');
		if (!paymentId) {
			return;
		}

		setReturnPaymentId(paymentId);
		setIsReturnModalOpen(true);

		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete('payment_id');
		setSearchParams(nextParams, {replace: true});
	}, [searchParams, setSearchParams]);

	const handlePayment = async (period: number, autoRenew: boolean) => {
		setIsCreatingPayment(true);
		try {
			const response = await createPayment(period, autoRenew);

			if (response.success && response.data?.confirmationUrl) {
				window.location.href = response.data.confirmationUrl;
				return;
			}

			NotificationStore.addNotification({
				type: 'error',
				title: 'Не удалось создать платеж',
				message: response.error || 'Попробуйте ещё раз позже',
			});
		} finally {
			setIsCreatingPayment(false);
		}
	};

	const handlePaymentSuccess = useCallback(async () => {
		await refreshHeaderGoalCounts();
		await refreshSubscriptionSilently();
	}, [refreshSubscriptionSilently]);

	const handleCloseReturnModal = useCallback(
		(statusAtClose: PaymentReturnModalCloseStatus) => {
			setIsReturnModalOpen(false);
			setReturnPaymentId(null);
			if (statusAtClose === 'pending') {
				refreshSubscriptionSilently().catch(() => undefined);
			}
		},
		[refreshSubscriptionSilently]
	);

	const handleUnlinkCard = async () => {
		setIsUnlinkingCard(true);
		try {
			const response = await unlinkPaymentMethod();

			if (response.success) {
				setSubscription((prev) => ({
					...prev,
					isAutoRenew: false,
					hasSavedPaymentMethod: false,
				}));
				return;
			}

			NotificationStore.addNotification({
				type: 'error',
				title: 'Не удалось отвязать карту',
				message: response.error || 'Попробуйте ещё раз позже',
			});
		} finally {
			setIsUnlinkingCard(false);
		}
	};

	const isEarlyRenewal = subscription.type === 'premium' && isWithinEarlyRenewalWindow(subscription.expiresAt);

	const showPaymentForm = subscription.type === 'free' || (isEarlyRenewal && !subscription.isAutoRenew);

	const showAutoRenewNotice = isEarlyRenewal && subscription.isAutoRenew;

	return (
		<section className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Подписка
				</Title>
				<Button theme="blue" size="small" icon="bullseye" onClick={() => setIsComparisonOpen(true)}>
					Сравнить тарифы
				</Button>
			</div>

			{isLoading ? (
				<UserSelfSubscriptionSkeleton />
			) : (
				<>
					<CurrentSubscription
						type={subscription.type}
						expiresAt={subscription.expiresAt}
						isAutoRenew={subscription.isAutoRenew}
						hasSavedPaymentMethod={subscription.hasSavedPaymentMethod}
						onUnlinkCard={handleUnlinkCard}
						isUnlinkLoading={isUnlinkingCard}
					/>

					<div className={element('plans')}>
						<SubscriptionPlanCard
							type="free"
							title="Базовый"
							subtitle="Для тех, кто делает первые шаги в лучшую жизнь"
							features={FREE_FEATURES}
							isCurrent={subscription.type === 'free'}
						/>
						<SubscriptionPlanCard
							type="premium"
							title="Премиум"
							subtitle="Максимум возможностей для ваших достижений"
							features={PREMIUM_FEATURES}
							isCurrent={subscription.type === 'premium'}
							isRecommended={subscription.type !== 'premium'}
						/>
					</div>

					{showAutoRenewNotice && (
						<div className={element('auto-renew-notice')}>
							<p className={element('auto-renew-notice-text')}>
								Подписка продлится автоматически в день окончания текущего периода.
							</p>
							<p className={element('auto-renew-notice-text')}>
								Чтобы сменить период (например, с месяца на год), отключите автосписание в блоке выше — после этого появится
								форма оплаты.
							</p>
						</div>
					)}

					{showPaymentForm && (
						<SubscriptionPayment
							periods={SUBSCRIPTION_PERIODS}
							onPayment={handlePayment}
							isPaymentLoading={isCreatingPayment}
							mode={subscription.type === 'free' ? 'purchase' : 'renew'}
						/>
					)}
				</>
			)}

			<SubscriptionComparisonModal isOpen={isComparisonOpen} onClose={() => setIsComparisonOpen(false)} />

			<PaymentReturnModal
				isOpen={isReturnModalOpen}
				onClose={handleCloseReturnModal}
				paymentId={returnPaymentId}
				onPaymentSuccess={handlePaymentSuccess}
			/>
		</section>
	);
});
