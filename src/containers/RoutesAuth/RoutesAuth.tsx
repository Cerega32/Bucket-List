import {FC} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {PageMain} from '@/pages/PageDetailGoal/PageDetailGoal';

export const RoutesAuth: FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<PageMain />} />
			</Routes>
		</BrowserRouter>
	);
};
