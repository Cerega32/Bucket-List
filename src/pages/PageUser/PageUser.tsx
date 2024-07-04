import {FC, useEffect} from 'react';

import {User} from '@/containers/User/User';
import {IPage} from '@/typings/page';
import {ThemeStore} from '@/store/ThemeStore';

export const PageUser: FC<IPage> = ({page, subPage}) => {
	const {setHeader, setPage} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <User page={page} subPage={subPage as string} />;
};
