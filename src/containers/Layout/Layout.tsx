import {observer} from 'mobx-react-lite';
import {FC} from 'react';
import {BrowserRouter} from 'react-router-dom';

import {CookieBanner} from '@/components/CookieBanner/CookieBanner';
import {Header} from '@/components/Header/Header';
import {Modal} from '@/components/Modal/Modal';
import {useBem} from '@/hooks/useBem';
import {ThemeStore} from '@/store/ThemeStore';

import NotificationContainer from '../Notifications/NotificationContainer';
import {RoutesAuth} from '../RoutesAuth/RoutesAuth';

import '../../_commons/styles-supports/scaffolding.scss';

import {Footer} from '@/components/Footer/Footer';
import './layout.scss';

const Layout: FC = observer(() => {
	const [block] = useBem('layout');
	const {full} = ThemeStore;

	return (
		<BrowserRouter>
			<Header />
			<div className={block({full})}>
				<RoutesAuth />
				<Modal />
				<NotificationContainer />
			</div>
			<Footer />
			<CookieBanner />
		</BrowserRouter>
	);
});

export default Layout;
