import {FC, useEffect} from 'react';

import {MainGoals} from '@/containers/MainGoals/MainGoals';
import {IPage} from '@/typings/page';
import {ThemeStore} from '@/store/ThemeStore';

export const PageMainGoals: FC<IPage> = ({page}) => {
	const {setHeader, setPage} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <MainGoals page={page} />;
};
