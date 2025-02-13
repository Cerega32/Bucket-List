import {FC, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {Login} from '@/components/Login/Login';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageLogin: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	const navigate = useNavigate();

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Login isPage openRegistration={() => navigate('/sign-up')} successLogin={() => navigate('/')} />;
};
