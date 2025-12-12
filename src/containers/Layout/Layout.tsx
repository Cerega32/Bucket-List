import {observer} from 'mobx-react-lite';
import {FC} from 'react';
import {BrowserRouter} from 'react-router-dom';

import {Header} from '@/components/Header/Header';
import {Modal} from '@/components/Modal/Modal';
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
				v7_relativeSplatPath: true,
			}}
		>
			<Header />
			<div className={block({full})}>
				<RoutesAuth />
				<Modal />
				<NotificationContainer />
			</div>
		</BrowserRouter>
	);
});

export default Layout;
