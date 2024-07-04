import {FC, useEffect} from 'react';

import {NotFound} from '@/containers/NotFound/NotFound';
import {IPage} from '@/typings/page';
import {ThemeStore} from '@/store/ThemeStore';

export const PageNotFound: FC<IPage> = ({page}) => {
	const {setHeader, setPage} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <NotFound />;
};
