import {FC, useEffect} from 'react';

import {Categories} from '@/containers/Categories/Categories';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageCategories: FC<IPage> = ({page}) => {
	const {setPage, setHeader} = ThemeStore;

	useEffect(() => {
		setPage(page);
		setHeader('white');
	}, [page, setPage]);

	return <Categories page={page} />;
};
