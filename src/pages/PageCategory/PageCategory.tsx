import {FC, useEffect} from 'react';

import {Category} from '@/containers/Category/Category';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageCategory: FC<IPage> = ({page, subPage}) => {
	const {setPage} = ThemeStore;

	useEffect(() => {
		setPage(page);
	}, []);

	return <Category page={page} subPage={subPage} />;
};
