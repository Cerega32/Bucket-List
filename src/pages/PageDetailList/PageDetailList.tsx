import {FC, useEffect} from 'react';
import {ListGoalsContainer} from '@/containers/ListGoalsContainer/ListGoalsContainer';
import {ThemeStore} from '@/store/ThemeStore';
import {IPage} from '@/typings/page';

export const PageDetailList: FC<IPage> = ({page}) => {
	const {setHeader, setPage} = ThemeStore;

	useEffect(() => {
		setHeader('white');
		setPage(page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <ListGoalsContainer />;
};
