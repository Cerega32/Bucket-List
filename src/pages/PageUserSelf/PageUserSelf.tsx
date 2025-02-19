import {FC, useEffect} from 'react';

import {UserSelf} from '@/containers/UserSelf/UserSelf';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageUserSelf: FC<IPage> = ({page, subPage}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <UserSelf page={page} subPage={subPage as string} />;
};
