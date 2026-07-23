import {scheduleHeaderGoalCountsRefresh} from '@/entities/goal/lib/headerGoalCountsRefresh';
import {isRegularGoalsLimitApiError, notifyRegularGoalsLimitApiError} from '@/entities/regular-goal/lib/checkRegularGoalsAddLimit';
import {UserStore} from '@/entities/user/model/UserStore';
import {registerApiErrorCodeHandler, registerAuthClearedHandler} from '@/shared/api/http/interceptors';

/** Регистрация хендлеров shared/api/http/requests.ts — импортируется один раз до первого рендера (см. src/index.tsx) */

registerAuthClearedHandler(() => {
	UserStore.setIsAuth(false);
	UserStore.setAvatar('');
	UserStore.setName('');
});

registerApiErrorCodeHandler((code) => {
	if (isRegularGoalsLimitApiError(code)) {
		notifyRegularGoalsLimitApiError(code);
		scheduleHeaderGoalCountsRefresh();
		return true;
	}

	return false;
});
