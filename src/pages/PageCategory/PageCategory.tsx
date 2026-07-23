import {FC, useEffect} from 'react';

import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';
import {Category} from '@/widgets/category/Category';

export const PageCategory: FC<IPage> = ({page, subPage}) => {
	const {setPage, setHeader, setFull} = ThemeStore;

	useEffect(() => {
		setPage(page);
		if (page === 'isCategoriesAll') {
			setHeader('white');
			setFull(false);
		} else {
			setHeader('transparent');
			setFull(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page]);

	return <Category page={page} subPage={subPage} />;
};
