import {FC} from 'react';
import {RoutesAuth} from '../RoutesAuth/RoutesAuth';

import '../../_commons/styles-supports/scaffolding.scss';
import {Header} from '@/components/Header/Header';

const Layout: FC = () => {
	return (
		<>
			<Header />
			<RoutesAuth />
		</>
	);
};

export default Layout;
