import {FC} from 'react';
import {RoutesAuth} from '../RoutesAuth/RoutesAuth';

import '../../_commons/styles-supports/scaffolding.scss';
import {Header} from '@/components/Header/Header';
import {Modal} from '@/components/Modal/Modal';

const Layout: FC = () => {
	return (
		<>
			<Header />
			<RoutesAuth />
			<Modal />
		</>
	);
};

export default Layout;
