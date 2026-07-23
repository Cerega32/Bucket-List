import {FC, useEffect} from 'react';

import {AddGoalList} from '@/features/add-goal-list/AddGoalList';
import {ThemeStore} from '@/shared/model/ThemeStore';

interface PageCreateGoalListProps {
	page: string;
}

export const PageCreateGoalList: FC<PageCreateGoalListProps> = ({page}) => {
	const {setPage, setHeader, setFull} = ThemeStore;

	useEffect(() => {
		setPage(page);
		setHeader('white');
		setFull(false);
	}, [page, setPage, setHeader, setFull]);

	return <AddGoalList />;
};
