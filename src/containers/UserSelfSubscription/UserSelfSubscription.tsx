import {observer} from 'mobx-react-lite';
import {FC, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';

import {CurrentSubscription} from './CurrentSubscription/CurrentSubscription';
import {SubscriptionComparisonModal} from './SubscriptionComparisonModal/SubscriptionComparisonModal';
import {SubscriptionPayment} from './SubscriptionPayment/SubscriptionPayment';
import {SubscriptionPlanCard} from './SubscriptionPlanCard/SubscriptionPlanCard';
import './user-self-subscription.scss';

// Моковые данные текущей подписки для free и премиум
// const MOCK_CURRENT_SUBSCRIPTION = {
// 	type: 'free' as 'free' | 'premium',
// 	expiresAt: null as string | null,
// 	isAutoRenew: false,
// };
const MOCK_CURRENT_SUBSCRIPTION = {
	type: 'premium' as 'free' | 'premium',
	expiresAt: '2025-02-15T00:00:00Z' as string | null,
	isAutoRenew: true,
};

// Периоды подписки
const SUBSCRIPTION_PERIODS = [
	{value: 1, label: '1 месяц', price: 199, pricePerMonth: 199},
	{value: 6, label: '6 месяцев', price: 1074, pricePerMonth: 179, discount: 10},
	{value: 12, label: '1 год', price: 1990, pricePerMonth: 166, discount: 17},
] as const;

// Фичи тарифов
const FREE_FEATURES = [
	'Количество целей не ограничен',
	'100 целей уже готовы к старту',
	'Добавление готовых списков',
	'До 3 регулярных целей',
	'До 10 мест на карте',
	'Базовые достижения',
	'1 задание для получения опыта',
	'Базовая статистика',
];

const PREMIUM_FEATURES = [
	'Всё из Базового тарифа',
	'До 20 регулярных целей',
	'Кастомные расписания выполнения',
	'Эксклюзивные Premium достижения',
	'3 задания для получения опыта (×3 опыт)',
	'Расширенная аналитика за год',
	'Совместные папки и сравнение прогресса с друзьями',
	'Уведомления в мессенджерах',
];

export const UserSelfSubscription: FC = observer(() => {
	const [block, element] = useBem('user-self-subscription');
	const [isComparisonOpen, setIsComparisonOpen] = useState(false);

	const handlePayment = (period: number, autoRenew: boolean) => {
		const periodData = SUBSCRIPTION_PERIODS.find((p) => p.value === period);
		console.log('Оплата:', {period, price: periodData?.price, autoRenew});
		alert(`Оплата (мок): ${periodData?.price}₽ за ${periodData?.label}`);
	};

	const handleToggleAutoRenew = (value: boolean) => {
		console.log('Изменение автопродления:', value);
		// TODO: реализовать API вызов для изменения автопродления
		alert(`Автопродление ${value ? 'включено' : 'отключено'} (мок)`);
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

			<CurrentSubscription
				type={MOCK_CURRENT_SUBSCRIPTION.type}
				expiresAt={MOCK_CURRENT_SUBSCRIPTION.expiresAt}
				isAutoRenew={MOCK_CURRENT_SUBSCRIPTION.isAutoRenew}
				onToggleAutoRenew={handleToggleAutoRenew}
			/>

			<div className={element('plans')}>
				<SubscriptionPlanCard
					type="free"
					title="Базовый"
					subtitle="Для тех, кто делает первые шаги в лучшую жизнь"
					features={FREE_FEATURES}
					isCurrent={MOCK_CURRENT_SUBSCRIPTION.type === 'free'}
				/>
				<SubscriptionPlanCard
					type="premium"
					title="Премиум"
					subtitle="Максимум возможностей для ваших достижений"
					features={PREMIUM_FEATURES}
					isCurrent={MOCK_CURRENT_SUBSCRIPTION.type === 'premium'}
					isRecommended={MOCK_CURRENT_SUBSCRIPTION.type !== 'premium'}
				/>
			</div>

			{MOCK_CURRENT_SUBSCRIPTION.type === 'free' && <SubscriptionPayment periods={SUBSCRIPTION_PERIODS} onPayment={handlePayment} />}

			<SubscriptionComparisonModal isOpen={isComparisonOpen} onClose={() => setIsComparisonOpen(false)} />
		</section>
	);
});
