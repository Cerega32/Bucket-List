import {observer} from 'mobx-react-lite';
import {FC} from 'react';
import {BrowserRouter} from 'react-router-dom';

import {CookieBanner} from '@/components/CookieBanner/CookieBanner';
import {EmailConfirmationBanner} from '@/components/EmailConfirmationBanner/EmailConfirmationBanner';
import {Footer} from '@/components/Footer/Footer';
import {Header} from '@/components/Header/Header';
import {Modal} from '@/components/Modal/Modal';
import {SEO} from '@/components/SEO/SEO';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';

import NotificationContainer from '../Notifications/NotificationContainer';
import {RoutesAuth} from '../RoutesAuth/RoutesAuth';

import '../../_commons/styles-supports/scaffolding.scss';

import './layout.scss';

const Layout: FC = observer(() => {
	const [block] = useBem('layout');
	const {full} = ThemeStore;

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
		</BrowserRouter>
	);
});

export default Layout;
