import {FC, useEffect} from 'react';

import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

import {HelpContainer} from '../../containers/HelpContainer/HelpContainer';

export const PageHelp: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <HelpContainer />;
};
