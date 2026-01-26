import {FC, useEffect} from 'react';

import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

import {TariffsContainer} from '../../containers/TariffsContainer/TariffsContainer';

export const PageTariffs: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		setFull(false);
	}, []);

	return <TariffsContainer />;
};
