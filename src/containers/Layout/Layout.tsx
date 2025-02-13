import {FC} from 'react';

import {RoutesAuth} from '../RoutesAuth/RoutesAuth';

import '../../_commons/styles-supports/scaffolding.scss';
import {Header} from '@/components/Header/Header';
import {Modal} from '@/components/Modal/Modal';
import {BrowserRouter} from 'react-router-dom';
import {NotificationStore} from '@/store/NotificationStore';
import NotificationContainer from '../Notifications/NotificationContainer';
import './layout.scss';
import {useBem} from '@/hooks/useBem';
import {observer} from 'mobx-react';
import {ThemeStore} from '@/store/ThemeStore';

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
		</BrowserRouter>
	);
});

export default Layout;
