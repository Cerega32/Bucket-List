import {FC, useEffect} from 'react';

import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';
import {Leaders} from '@/widgets/leaders/Leaders';

export const PageLeaders: FC<IPage> = ({page}) => {
	const {setPage, setHeader, setFull} = ThemeStore;

	useEffect(() => {
		setPage(page);
		setHeader('white');
		setFull(false);
	}, [page, setPage, setHeader, setFull]);

	return <Leaders />;
};
