import {observer} from 'mobx-react-lite';
import {FC, useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {Title} from '@/components/Title/Title';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';

import {FREE_FEATURES, PREMIUM_FEATURES, SUBSCRIPTION_PERIODS} from '../UserSelfSubscription/subscription-constants';
import {SubscriptionComparisonModal} from '../UserSelfSubscription/SubscriptionComparisonModal/SubscriptionComparisonModal';
import {SubscriptionPayment} from '../UserSelfSubscription/SubscriptionPayment/SubscriptionPayment';
import {SubscriptionPlanCard} from '../UserSelfSubscription/SubscriptionPlanCard/SubscriptionPlanCard';

import './tariffs-container.scss';

export const TariffsContainer: FC = observer(() => {
	const [block, element] = useBem('tariffs-container');
	const [isComparisonOpen, setIsComparisonOpen] = useState(false);
	const {isAuth} = UserStore;

	return (
		<section className={block()}>
			<div className={element('header')}>
				<Title tag="h2" className={element('title')}>
					Тарифы
				</Title>
				<Button theme="blue" size="small" icon="bullseye" onClick={() => setIsComparisonOpen(true)}>
					Сравнить тарифы
				</Button>
			</div>

			<div className={element('plans')}>
				<SubscriptionPlanCard
					type="free"
					title="Базовый"
					subtitle="Для тех, кто делает первые шаги в лучшую жизнь"
					features={FREE_FEATURES}
				/>
				<SubscriptionPlanCard
					type="premium"
					title="Премиум"
					subtitle="Максимум возможностей для ваших достижений"
					features={PREMIUM_FEATURES}
					isRecommended
				/>
			</div>

			<SubscriptionPayment periods={SUBSCRIPTION_PERIODS} variant="preview" />

			<div className={element('support')}>
				<p className={element('support-text')}>
					Поддержите нас! Мы горим идеей помочь людям превращать мечты в цели и достигать их. Каждая подписка — это не только ваши
					новые возможности, но и вклад в развитие платформы. Вместе мы делаем Delting лучше. 💙
				</p>
				{!isAuth && (
					<p className={element('support-cta')}>
						<Link to="/sign-up" className={element('support-link')}>
							Зарегистрируйтесь
						</Link>
						, чтобы оформить Premium и поддержать проект.
					</p>
				)}
			</div>

			<SubscriptionComparisonModal isOpen={isComparisonOpen} onClose={() => setIsComparisonOpen(false)} />
		</section>
	);
});
