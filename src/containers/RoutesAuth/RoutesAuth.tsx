import {FC} from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';

import {PageCategories} from '@/pages/PageCategories/PageCategories';
import {PageCategory} from '@/pages/PageCategory/PageCategory';
import {PageDetailGoal} from '@/pages/PageDetailGoal/PageDetailGoal';
import {PageDetailList} from '@/pages/PageDetailList/PageDetailList';
import {PageNotFound} from '@/pages/PageNotFound/PageNotFound';
import {PageUser} from '@/pages/PageUser/PageUser';

export const RoutesAuth: FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				{/* <Route path="/" element={<PageDetailGoal />} /> */}
				<Route path="/list/:id" element={<PageDetailList />} />
				<Route path="/categories" element={<PageCategories page="isCategories" />} />
				<Route path="/categories/:id" element={<PageCategory page="isCategories" subPage="goals" />} />
				<Route path="/categories/:categories/:id/" element={<PageCategory page="isSubCategories" subPage="goals" />} />
				<Route path="/categories/:id/lists" element={<PageCategory page="isCategories" subPage="lists" />} />
				<Route path="/categories/:categories/:id/lists" element={<PageCategory page="isSubCategories" subPage="lists" />} />
				<Route path="/goals/:id/lists" element={<PageDetailGoal page="isGoalLists" />} />
				<Route path="/goals/:id" element={<PageDetailGoal page="isGoal" />} />
				<Route path="/user/:id/showcase" element={<PageUser page="isUserShowcase" />} />
				<Route path="/user/:id/100-goal" element={<PageUser page="isUser100Goals" />} />
				<Route path="/user/:id/active-goals" element={<PageUser page="isUserActiveGoals" subPage="goals" />} />
				<Route path="/user/:id/active-goals/lists" element={<PageUser page="isUserActiveGoals" subPage="lists" />} />
				<Route path="/user/:id/done-goals" element={<PageUser page="isUserDoneGoals" subPage="goals" />} />
				<Route path="/user/:id/done-goals/lists" element={<PageUser page="isUserDoneGoals" subPage="lists" />} />
				<Route path="/user/:id/achievements" element={<PageUser page="isUserAchievements" />} />
				<Route path="/user/showcase" element={<PageUser page="isUserShowcase" />} />
				<Route path="/user/100-goal" element={<PageUser page="isUserMainGoals" />} />
				<Route path="/user/active-goals" element={<PageUser page="isUserActiveGoals" />} />
				<Route path="/user/done-goals" element={<PageUser page="isUserDoneGoals" />} />
				<Route path="*" element={<PageNotFound page="NotFound" />} />
			</Routes>
		</BrowserRouter>
	);
};
