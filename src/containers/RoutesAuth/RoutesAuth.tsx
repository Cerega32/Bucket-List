import {FC} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {PageDetailGoal} from '@/pages/PageDetailGoal/PageDetailGoal';
import {PageDetailList} from '@/pages/PageDetailList/PageDetailList';
import {PageUser} from '@/pages/PageUser/PageUser';

export const RoutesAuth: FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<PageDetailGoal />} />
				<Route path="/list/:id" element={<PageDetailList />} />
				<Route path="/goals/:id" element={<PageDetailGoal />} />
				<Route path="/user/showcase" element={<PageUser />} />
			</Routes>
		</BrowserRouter>
	);
};
