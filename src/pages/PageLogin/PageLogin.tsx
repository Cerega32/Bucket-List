import Cookies from 'js-cookie';
import {FC, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {getUser} from '@/entities/user/api/getUser';
import {UserStore} from '@/entities/user/model/UserStore';
import {Login} from '@/features/login/Login';
import {ModalStore} from '@/shared/model/ModalStore';
import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';

export const PageLogin: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;
	const {setWindow, setIsOpen, setModalProps} = ModalStore;

	const {setName, setIsAuth, setAvatar} = UserStore;

	const navigate = useNavigate();

	const openForgotPassword = (email?: string) => {
		setModalProps({initialEmail: email ?? ''});
		setWindow('forgot-password');
		setIsOpen(true);
	};

	const successLogin = (data: {name: string}) => {
		Cookies.set('name', data.name || '');
		setName(data.name || '');
		setIsAuth(true);
		setAvatar(Cookies.get('avatar') || '');
		getUser();
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
