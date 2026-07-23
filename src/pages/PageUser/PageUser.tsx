import {FC, useEffect} from 'react';

import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';
import {User} from '@/widgets/user/User';

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
