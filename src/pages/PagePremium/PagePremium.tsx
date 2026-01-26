import {FC} from 'react';
import {Navigate} from 'react-router-dom';

import {UserStore} from '@/store/UserStore';

/**
 * Редирект: авторизован → /user/self/subs, иначе → /tariffs.
 * Используется в письмах (Узнать о Premium) для одной ссылки.
 */
export const PagePremium: FC = () => {
	const {isAuth} = UserStore;
	return <Navigate to={isAuth ? '/user/self/subs' : '/tariffs'} replace />;
};
