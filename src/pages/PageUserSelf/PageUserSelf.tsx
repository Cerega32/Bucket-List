import {FC, useEffect} from 'react';

import {UserSelf} from '@/containers/UserSelf/UserSelf';
import {IPage} from '@/typings/page';
import {ThemeStore} from '@/store/ThemeStore';

export const PageUserSelf: FC<IPage> = ({page, subPage}) => {
	const {setHeader, setPage} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <UserSelf page={page} subPage={subPage as string} />;
};
