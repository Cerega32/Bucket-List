import {FC, useEffect} from 'react';

import {Category} from '@/containers/Category/Category';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageCategory: FC<IPage> = ({page, subPage}) => {
	const {setPage, setHeader, setFull} = ThemeStore;

	useEffect(() => {
		setPage(page);
		setHeader('transparent');
		setFull(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Category page={page} subPage={subPage} />;
};
