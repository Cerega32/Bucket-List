import {FC} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {PageDetailGoal} from '@/pages/PageDetailGoal/PageDetailGoal';
import {PageDetailList} from '@/pages/PageDetailList/PageDetailList';
import {PageUser} from '@/pages/PageUser/PageUser';
import {PageNotFound} from '@/pages/PageNotFound/PageNotFound';
import {PageCategories} from '@/pages/PageCategories/PageCategories';

export const RoutesAuth: FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				{/* <Route path="/" element={<PageDetailGoal />} /> */}
				<Route path="/list/:id" element={<PageDetailList />} />
				<Route
					path="/categories"
					element={<PageCategories page="isCategories" />}
				/>
				<Route
					path="/goals/:id/lists"
					element={<PageDetailGoal page="isGoalLists" />}
				/>
				<Route
					path="/goals/:id"
					element={<PageDetailGoal page="isGoal" />}
				/>
				<Route
					path="/user/showcase"
					element={<PageUser page="isUserShowcase" />}
				/>
				<Route
					path="/user/100-goal"
					element={<PageUser page="isUserMainGoals" />}
				/>
				<Route
					path="/user/active-goals"
					element={<PageUser page="isUserActiveGoals" />}
				/>
				<Route
					path="/user/done-goals"
					element={<PageUser page="isUserDoneGoals" />}
				/>
				<Route path="*" element={<PageNotFound page="NotFound" />} />
			</Routes>
		</BrowserRouter>
	);
};
