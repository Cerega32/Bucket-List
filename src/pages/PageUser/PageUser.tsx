import {FC, useEffect} from 'react';

import {User} from '@/containers/User/User';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageUser: FC<IPage> = ({page, subPage}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <User page={page} subPage={subPage as string} />;
};
