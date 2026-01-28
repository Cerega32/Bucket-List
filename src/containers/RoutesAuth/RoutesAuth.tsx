import {observer} from 'mobx-react-lite';
import {FC} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';

import {ScrollToTopOnRouteChange} from '@/components/ScrollToTopOnRouteChange/ScrollToTopOnRouteChange';
import {NewsDetailPage} from '@/pages/NewsDetailPage/NewsDetailPage';
import {NewsPage} from '@/pages/NewsPage/NewsPage';
import {PageAbout} from '@/pages/PageAbout/PageAbout';
import {PageAgreement} from '@/pages/PageAgreement/PageAgreement';
import {PageCategories} from '@/pages/PageCategories/PageCategories';
import {PageCategory} from '@/pages/PageCategory/PageCategory';
import {PageContacts} from '@/pages/PageContacts/PageContacts';
import {PageCookies} from '@/pages/PageCookies/PageCookies';
import {PageCreateGoal} from '@/pages/PageCreateGoal/PageCreateGoal';
import {PageCreateGoalList} from '@/pages/PageCreateGoalList/PageCreateGoalList';
import {PageDetailGoal} from '@/pages/PageDetailGoal/PageDetailGoal';
import {PageDetailList} from '@/pages/PageDetailList/PageDetailList';
import {PageEditGoalList} from '@/pages/PageEditGoalList/PageEditGoalList';
import {PageEmailConfirmed} from '@/pages/PageEmailConfirmed/PageEmailConfirmed';
import {PageHelp} from '@/pages/PageHelp/PageHelp';
import {PageLeaders} from '@/pages/PageLeaders/PageLeaders';
import {PageLogin} from '@/pages/PageLogin/PageLogin';
import {PageMain} from '@/pages/PageMain/PageMain';
import {PageMainGoals} from '@/pages/PageMainGoals/PageMainGoals';
import {PageNotFound} from '@/pages/PageNotFound/PageNotFound';
import {PagePremium} from '@/pages/PagePremium/PagePremium';
import {PagePrivacy} from '@/pages/PagePrivacy/PagePrivacy';
import {PageRegistration} from '@/pages/PageRegistration/PageRegistration';
import {PageResetPassword} from '@/pages/PageResetPassword/PageResetPassword';
import {PageTariffs} from '@/pages/PageTariffs/PageTariffs';
import {PageTerms} from '@/pages/PageTerms/PageTerms';
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
			<ScrollToTopOnRouteChange />
			<Routes>
				{/* Новый маршрут для дашборда (главной страницы) */}
				{/* <Route path="/" element={<PageDashboard page="isDashboard" />} /> */}
				<Route path="/" element={<PageMain page="isMain" />} />

				{/* Перемещаем старую главную страницу на новый путь */}
				<Route path="/100-goals" element={<PageMainGoals page="isMainGoals" />} />

				{/* Маршруты для новостей */}
				<Route path="/news" element={<NewsPage />} />
				<Route path="/news/:id" element={<NewsDetailPage />} />

				{/* Информационные страницы */}
				<Route path="/about" element={<PageAbout page="isAbout" />} />
				<Route path="/help" element={<PageHelp page="isHelp" />} />
				<Route path="/contacts" element={<PageContacts page="isContacts" />} />
				<Route path="/tariffs" element={<PageTariffs page="isTariffs" />} />

				{/* Правовые документы */}
				<Route path="/privacy" element={<PagePrivacy page="isPrivacy" />} />
				<Route path="/terms" element={<PageTerms page="isTerms" />} />
				<Route path="/premium" element={<PagePremium />} />
				<Route path="/agreement" element={<PageAgreement page="isAgreement" />} />
				<Route path="/cookies" element={<PageCookies page="isCookies" />} />

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
				<Route path="/goals/:id/history" element={<PageDetailGoal page="isGoalHistory" />} />
				<Route path="/goals/:id/rating" element={<PageDetailGoal page="isGoalRating" />} />
				<Route path="/goals/:id/lists" element={<PageDetailGoal page="isGoalLists" />} />
				<Route path="/goals/:id" element={<PageDetailGoal page="isGoal" />} />
				<Route path="/sign-in" element={<PageLogin page="isLogin" />} />
				<Route path="/sign-up" element={<PageRegistration page="isRegistration" />} />
				<Route path="/reset-password" element={<PageResetPassword page="isResetPassword" />} />
				<Route path="/email-confirmed" element={<PageEmailConfirmed page="isEmailConfirmed" />} />
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
				<Route path="/user/self/maps" element={<ProtectedRoute element={<PageUserSelf page="isUserSelfMaps" />} />} />
				<Route
					path="/user/self/achievements"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfAchievements" />} />}
				/>
				<Route path="/user/self/settings" element={<ProtectedRoute element={<PageUserSelf page="isUserSelfSettings" />} />} />
				<Route path="/user/self/subs" element={<ProtectedRoute element={<PageUserSelf page="isUserSelfSubs" />} />} />
				<Route
					path="/user/self/active-goals"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfActive" subPage="goals" />} />}
				/>
				<Route path="/user/self/folders" element={<ProtectedRoute element={<PageUserSelf page="isUserSelfFolders" />} />} />
				<Route
					path="/user/self/folders/:folderId"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfFolders" />} />}
				/>
				<Route path="/user/self/progress" element={<ProtectedRoute element={<PageUserSelf page="isUserSelfProgress" />} />} />
				<Route path="/user/self/regular" element={<ProtectedRoute element={<PageUserSelf page="isUserSelfRegular" />} />} />
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

				{/* TODO System */}
				{/* <Route path="/todos" element={<ProtectedRoute element={<PageTodos page="isTodos" />} />} /> */}

				{/* Маршруты для друзей - теперь через UserSelf */}
				<Route
					path="/user/self/friends"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfFriends" subPage="friends" />} />}
				/>
				<Route
					path="/user/self/friends/requests"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfFriends" subPage="requests" />} />}
				/>
				<Route
					path="/user/self/friends/search"
					element={<ProtectedRoute element={<PageUserSelf page="isUserSelfFriends" subPage="search" />} />}
				/>

				{/* Редиректы старых маршрутов друзей на новые */}
				<Route path="/friends" element={<Navigate to="/user/self/friends" replace />} />
				<Route path="/friends/requests" element={<Navigate to="/user/self/friends/requests" replace />} />
				<Route path="/friends/search" element={<Navigate to="/user/self/friends/search" replace />} />

				<Route path="*" element={<PageNotFound page="NotFound" />} />
			</Routes>
		</main>
	);
});
