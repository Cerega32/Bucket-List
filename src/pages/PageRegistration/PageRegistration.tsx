import Cookies from 'js-cookie';
import {FC, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {Registration} from '@/components/Registration/Registration';
import {ThemeStore} from '@/store/ThemeStore';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';

export const PageRegistration: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	const {setName, setIsAuth, setAvatar, setUserInfo, userInfo} = UserStore;

	const navigate = useNavigate();

	const successRegistration = (data: {name?: string; email_confirmed?: boolean; email?: string}) => {
		Cookies.set('name', data.name || '');
		setName(data.name || '');
		setIsAuth(true);
		setAvatar(Cookies.get('avatar') || '');
		if (data.email_confirmed !== undefined) {
			UserStore.setEmailConfirmed(data.email_confirmed);
		}
		if (data.email) {
			UserStore.setEmail(data.email);
		}
		setUserInfo({
			...userInfo,
			email: data.email || userInfo.email,
			firstName: data.name || userInfo.firstName,
			name: data.name || userInfo.name,
			...(data.email_confirmed !== undefined && {isEmailConfirmed: data.email_confirmed}),
		});
		navigate('/list/100-goals');
	};

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Registration isPage openLogin={() => navigate('/sign-in')} successRegistration={successRegistration} />;
};
