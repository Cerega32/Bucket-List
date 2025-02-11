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
				<button
					onClick={() => NotificationStore.addNotification({type: 'success', title: 'Успешно!', message: 'Операция выполнена'})}
				>
					Добавить успех
				</button>
				<button
					onClick={() => NotificationStore.addNotification({type: 'error', title: 'Ошибка!', message: 'Что-то пошло не так'})}
				>
					Добавить ошибку
				</button>
				<button
					onClick={() => NotificationStore.addNotification({type: 'warning', title: 'Внимание!', message: 'Будьте осторожны'})}
				>
					Добавить предупреждение
				</button>
				<NotificationContainer />
			</div>
		</BrowserRouter>
	);
});

export default Layout;
