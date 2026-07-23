import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';
import {BrowserRouter} from 'react-router-dom';

import NotificationContainer from '@/app/providers/Notifications/NotificationContainer';
import {RoutesAuth} from '@/app/routes/RoutesAuth/RoutesAuth';
import {HeaderRegularGoalsStore} from '@/entities/regular-goal/model/HeaderRegularGoalsStore';
import {registerSubscriptionExpiryHandlers} from '@/entities/subscription/lib/subscriptionExpirySchedule';
import {SubscriptionExpiryBanner} from '@/entities/subscription/ui/SubscriptionExpiryBanner/SubscriptionExpiryBanner';
import {getUser} from '@/entities/user/api/getUser';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {ThemeStore} from '@/shared/model/ThemeStore';
import {SEO} from '@/shared/ui/SEO/SEO';
import {CookieBanner} from '@/widgets/cookie-banner/CookieBanner';
import {EmailConfirmationBanner} from '@/widgets/email-confirmation-banner/EmailConfirmationBanner';
import {Footer} from '@/widgets/footer/Footer';
import {Header} from '@/widgets/header/Header';
import {Modal} from '@/widgets/modal-root/Modal';

import '@/shared/styles/scaffolding.scss';

import '@/app/layout/Layout/layout.scss';

const Layout: FC = observer(() => {
	const [block] = useBem('layout');
	const {full} = ThemeStore;

	useEffect(() => {
		registerSubscriptionExpiryHandlers({
			onBannerTick: () => UserStore.bumpSubscriptionExpiryTick(),
			isPremium: () => UserStore.userSelf.subscriptionType === 'premium',
			onSyncProfile: () => {
				getUser()
					.then(() => HeaderRegularGoalsStore.loadTodayCount(UserStore.userSelf.regularGoalsSelectionPending ?? false))
					.catch(() => undefined);
			},
		});
	}, []);

	return (
		<BrowserRouter
			future={{
				v7_startTransition: true,
			}}
		>
			<Header />
			<div className={block({full})}>
				<RoutesAuth />
				<Modal />
				<NotificationContainer />
				<SEO title="delting.ru - достигайте своих целей" />
			</div>
			<Footer />
			<CookieBanner />
			<EmailConfirmationBanner />
			<SubscriptionExpiryBanner />
		</BrowserRouter>
	);
});

export default Layout;
