import {observer} from 'mobx-react-lite';
import {FC} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';

import {PageCategories} from '@/pages/PageCategories/PageCategories';
import {PageCategory} from '@/pages/PageCategory/PageCategory';
import {PageCreateGoal} from '@/pages/PageCreateGoal/PageCreateGoal';
import {PageCreateGoalList} from '@/pages/PageCreateGoalList/PageCreateGoalList';
import {PageDetailGoal} from '@/pages/PageDetailGoal/PageDetailGoal';
import {PageDetailList} from '@/pages/PageDetailList/PageDetailList';
import {PageEditGoalList} from '@/pages/PageEditGoalList/PageEditGoalList';
import {PageLeaders} from '@/pages/PageLeaders/PageLeaders';
import {PageLogin} from '@/pages/PageLogin/PageLogin';
import {PageMain} from '@/pages/PageMain/PageMain';
import {PageMainGoals} from '@/pages/PageMainGoals/PageMainGoals';
import {PageNotFound} from '@/pages/PageNotFound/PageNotFound';
import {PageRegistration} from '@/pages/PageRegistration/PageRegistration';
import {PageUser} from '@/pages/PageUser/PageUser';
import {PageUserSelf} from '@/pages/PageUserSelf/PageUserSelf';
import {UserStore} from '@/store/UserStore';

import './routes-auth.scss';

// Компонент защищенного маршрута
interface ProtectedRouteProps {
	element: React.ReactElement;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({element}) => {
	const {isAuth} = UserStore;

	if (!isAuth) {
		return <Navigate to="/sign-in" replace />;
	}

	return element;
};

export const RoutesAuth: FC = observer(() => {
	return (
		<main className="main">
			<Routes>
				{/* Новый маршрут для дашборда (главной страницы) */}
				{/* <Route path="/" element={<PageDashboard page="isDashboard" />} /> */}
				<Route path="/" element={<PageMain page="isMain" />} />

				{/* Перемещаем старую главную страницу на новый путь */}
				<Route path="/100-goals" element={<PageMainGoals page="isMainGoals" />} />

				{/* Остальные маршруты остаются без изменений */}
				<Route path="/list/:id" element={<PageDetailList page="isList" />} />
				<Route path="/edit-list/:id" element={<PageEditGoalList page="isEditList" />} />
				<Route path="/list/100-goals" element={<PageMainGoals page="isMainGoals" />} />
				<Route path="/categories" element={<PageCategories page="isCategories" />} />
				<Route path="/categories/all" element={<PageCategory page="isCategoriesAll" subPage="goals" />} />
				<Route path="/categories/all/lists" element={<PageCategory page="isCategoriesAll" subPage="lists" />} />
				<Route path="/categories/:id" element={<PageCategory page="isCategories" subPage="goals" />} />
				<Route path="/categories/:categories/:id/" element={<PageCategory page="isSubCategories" subPage="goals" />} />
				<Route path="/categories/:id/lists" element={<PageCategory page="isCategories" subPage="lists" />} />
				<Route path="/categories/:categories/:id/lists" element={<PageCategory page="isSubCategories" subPage="lists" />} />
				<Route path="/goals/:id/lists" element={<PageDetailGoal page="isGoalLists" />} />
				<Route path="/goals/:id" element={<PageDetailGoal page="isGoal" />} />
				<Route path="/sign-in" element={<PageLogin page="isLogin" />} />
				<Route path="/sign-up" element={<PageRegistration page="isRegistration" />} />
				<Route path="/leaders" element={<PageLeaders page="isLeaders" />} />
				<Route path="/user/:id/showcase" element={<PageUser page="isUserShowcase" />} />
				<Route path="/user/:id/100-goal" element={<PageUser page="isUser100Goals" />} />
				<Route path="/user/:id/active-goals" element={<PageUser page="isUserActiveGoals" subPage="goals" />} />
				<Route path="/user/:id/active-goals/lists" element={<PageUser page="isUserActiveGoals" subPage="lists" />} />
				<Route path="/user/:id/done-goals" element={<PageUser page="isUserDoneGoals" subPage="goals" />} />
				<Route path="/user/:id/done-goals/lists" element={<PageUser page="isUserDoneGoals" subPage="lists" />} />
				<Route path="/user/:id/achievements" element={<PageUser page="isUserAchievements" />} />

				<Route path="/goals/create" element={<ProtectedRoute element={<PageCreateGoal page="isCreateGoal" />} />} />
				<Route path="/list/create" element={<ProtectedRoute element={<PageCreateGoalList page="isCreateGoalList" />} />} />

				{/* Защищенные маршруты пользователя */}
				<Route path="/user/self" element={<ProtectedRoute element={<PageUserSelf page="isUserSelf" />} />} />
				<Route
					path="/user/self/achievements"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfAchievements" />} />}
				/>
				<Route path="/user/self/settings" element={<ProtectedRoute element={<PageUserSelf page="isUserSelfSettings" />} />} />
				<Route
					path="/user/self/active-goals"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfActive" subPage="goals" />} />}
				/>
				<Route
					path="/user/self/done-goals"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfDone" subPage="goals" />} />}
				/>
				<Route
					path="/user/self/active-goals/lists"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfActive" subPage="lists" />} />}
				/>
				<Route
					path="/user/self/done-goals/lists"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfDone" subPage="lists" />} />}
				/>

				{/* Новые маршруты для друзей */}
				{/* <Route path="/user/self/friends" element={<ProtectedRoute element={<PageFriends page="isUserSelfFriends" />} />} />
				<Route
					path="/friends/compare/:friendId"
					element={<ProtectedRoute element={<PageFriendCompare page="isFriendCompare" />} />}
				/> */}

				<Route path="*" element={<PageNotFound page="NotFound" />} />
			</Routes>
		</main>
	);
});
