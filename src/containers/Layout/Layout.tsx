import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';
import {BrowserRouter} from 'react-router-dom';

import {CookieBanner} from '@/components/CookieBanner/CookieBanner';
import {EmailConfirmationBanner} from '@/components/EmailConfirmationBanner/EmailConfirmationBanner';
import {Footer} from '@/components/Footer/Footer';
import {Header} from '@/components/Header/Header';
import {Modal} from '@/components/Modal/Modal';
import {SEO} from '@/components/SEO/SEO';
import {SubscriptionExpiryBanner} from '@/components/SubscriptionExpiryBanner/SubscriptionExpiryBanner';
import {useBem} from '@/hooks/useBem';
import {useVisualViewportOffset} from '@/hooks/useVisualViewportOffset';
import {HeaderRegularGoalsStore} from '@/store/HeaderRegularGoalsStore';
import {ThemeStore} from '@/store/ThemeStore';
import {UserStore} from '@/store/UserStore';
import {getUser} from '@/utils/api/get/getUser';
import {registerSubscriptionExpiryHandlers} from '@/utils/subscription/subscriptionExpirySchedule';

import NotificationContainer from '../Notifications/NotificationContainer';
import {RoutesAuth} from '../RoutesAuth/RoutesAuth';

import '../../_commons/styles-supports/scaffolding.scss';

import './layout.scss';

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

	useVisualViewportOffset();

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
