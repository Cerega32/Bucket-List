import {FC, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {Registration} from '@/components/Registration/Registration';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageRegistration: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	const navigate = useNavigate();

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Registration isPage openLogin={() => navigate('/sign-in')} successRegistration={() => navigate('/')} />;
};
