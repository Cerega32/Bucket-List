import {FC} from 'react';

import {RoutesAuth} from '../RoutesAuth/RoutesAuth';

import '../../_commons/styles-supports/scaffolding.scss';
import {Header} from '@/components/Header/Header';
import {Modal} from '@/components/Modal/Modal';
import {BrowserRouter} from 'react-router-dom';

const Layout: FC = () => {
	return (
		<BrowserRouter>
			<Header />
			<RoutesAuth />
			<Modal />
		</BrowserRouter>
	);
};

export default Layout;
