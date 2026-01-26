import Cookies from 'js-cookie';
import {FC, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {Login} from '@/components/Login/Login';
import {ModalStore} from '@/store/ModalStore';
import {ThemeStore} from '@/store/ThemeStore';
import {UserStore} from '@/store/UserStore';
import {IPage} from '@/typings/page';

export const PageLogin: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;
	const {setWindow, setIsOpen} = ModalStore;

	const {setName, setIsAuth, setAvatar} = UserStore;

	const navigate = useNavigate();

	const openForgotPassword = () => {
		setWindow('forgot-password');
		setIsOpen(true);
	};

	const successLogin = (data: {name: string}) => {
		Cookies.set('name', data.name || '');
		setName(data.name || '');
		setIsAuth(true);
		setAvatar(Cookies.get('avatar') || '');
		navigate('/list/100-goals');
	};

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Login isPage openRegistration={() => navigate('/sign-up')} openForgotPassword={openForgotPassword} successLogin={successLogin} />
	);
};
