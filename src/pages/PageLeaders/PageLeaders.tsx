import {FC, useEffect} from 'react';

import {Leaders} from '@/containers/Leaders/Leaders';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageLeaders: FC<IPage> = ({page}) => {
	const {setPage, setHeader, setFull} = ThemeStore;

	useEffect(() => {
		setPage(page);
		setHeader('white');
		setFull(false);
	}, []);

	return <Leaders />;
};
