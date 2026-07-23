import {FC, useEffect} from 'react';

import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';
import {Categories} from '@/widgets/categories/Categories';

export const PageCategories: FC<IPage> = ({page}) => {
	const {setPage, setHeader, setFull} = ThemeStore;

	useEffect(() => {
		setPage(page);
		setHeader('white');
		setFull(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Categories />;
};
