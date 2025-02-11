import {FC, useEffect} from 'react';
import {Goal} from '@/containers/Goal/Goal';
import {IPage} from '@/typings/page';
import {ThemeStore} from '@/store/ThemeStore';

export const PageDetailGoal: FC<IPage> = ({page}) => {
	const {setHeader, setPage, setFull} = ThemeStore;

	useEffect(() => {
		setHeader('transparent');
		setPage(page);
		setFull(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Goal page={page} />;
};
