import {FC, useEffect} from 'react';

import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';
import {UserSelf} from '@/widgets/user-self/UserSelf';

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
