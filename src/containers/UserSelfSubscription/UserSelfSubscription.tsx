import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {getUserSubscription, updateSubscription, createPayment, IPayment} from '@/utils/api/subscription';

import {CurrentSubscription} from './CurrentSubscription/CurrentSubscription';
import {QRPaymentModal} from './QRPaymentModal/QRPaymentModal';
import {FREE_FEATURES, PREMIUM_FEATURES, SUBSCRIPTION_PERIODS} from './subscription-constants';
import {SubscriptionComparisonModal} from './SubscriptionComparisonModal/SubscriptionComparisonModal';
import {SubscriptionPayment} from './SubscriptionPayment/SubscriptionPayment';
import {SubscriptionPlanCard} from './SubscriptionPlanCard/SubscriptionPlanCard';
import './user-self-subscription.scss';

export const UserSelfSubscription: FC = observer(() => {
	const [block, element] = useBem('user-self-subscription');
	const [isComparisonOpen, setIsComparisonOpen] = useState(false);
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
	const [currentPayment, setCurrentPayment] = useState<IPayment | null>(null);
	const [subscription, setSubscription] = useState<{
		type: 'free' | 'premium';
		expiresAt: string | null;
		isAutoRenew: boolean;
	}>({
		type: 'free',
		expiresAt: null,
		isAutoRenew: false,
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadSubscription = async () => {
			setIsLoading(true);
			const response = await getUserSubscription();
			if (response.success && response.data) {
				setSubscription({
					type: response.data.subscriptionType,
					expiresAt: response.data.subscriptionExpiresAt,
					isAutoRenew: response.data.subscriptionAutoRenew,
				});
			}
			setIsLoading(false);
		};

		loadSubscription();
	}, []);

	const handlePayment = async (period: number, autoRenew: boolean) => {
		// Создаем платеж
		const response = await createPayment(period, autoRenew);

		if (response.success && response.data) {
			setCurrentPayment(response.data);
			setIsPaymentModalOpen(true);
		} else {
			alert(response.error || 'Не удалось создать платеж');
		}
	};

	const handlePaymentSuccess = async () => {
		// Обновляем информацию о подписке
		const response = await getUserSubscription();
		if (response.success && response.data) {
			setSubscription({
				type: response.data.subscriptionType,
				expiresAt: response.data.subscriptionExpiresAt,
				isAutoRenew: response.data.subscriptionAutoRenew,
			});
		}
	};

	const handleToggleAutoRenew = async (value: boolean) => {
		const response = await updateSubscription({
			subscription_auto_renew: value,
		});

		if (response.success) {
			setSubscription((prev) => ({
				...prev,
				isAutoRenew: value,
			}));
		} else {
			alert('Не удалось изменить настройки автопродления');
		}
	};

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

			{!isLoading && (
				<>
					<CurrentSubscription
						type={subscription.type}
						expiresAt={subscription.expiresAt}
						isAutoRenew={subscription.isAutoRenew}
						onToggleAutoRenew={handleToggleAutoRenew}
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

					{subscription.type === 'free' && <SubscriptionPayment periods={SUBSCRIPTION_PERIODS} onPayment={handlePayment} />}
				</>
			)}

			<SubscriptionComparisonModal isOpen={isComparisonOpen} onClose={() => setIsComparisonOpen(false)} />

			<QRPaymentModal
				isOpen={isPaymentModalOpen}
				onClose={() => {
					setIsPaymentModalOpen(false);
					setCurrentPayment(null);
				}}
				payment={currentPayment}
				onPaymentSuccess={handlePaymentSuccess}
			/>
		</section>
	);
});
