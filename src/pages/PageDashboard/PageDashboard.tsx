import {FC, useEffect} from 'react';

import {Dashboard} from '@/containers/Dashboard/Dashboard';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageDashboard: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Dashboard />;
};
