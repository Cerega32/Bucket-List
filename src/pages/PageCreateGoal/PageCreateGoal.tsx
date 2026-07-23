import {FC, useEffect} from 'react';

import {AddGoal} from '@/features/add-goal/AddGoal';
import {ThemeStore} from '@/shared/model/ThemeStore';
import {IPage} from '@/shared/types/page';

export const PageCreateGoal: FC<IPage> = ({page}) => {
	const {setPage, setHeader, setFull} = ThemeStore;

	useEffect(() => {
		setPage(page);
		setHeader('white');
		setFull(false);
	}, [page, setPage, setHeader, setFull]);

	return <AddGoal />;
};
