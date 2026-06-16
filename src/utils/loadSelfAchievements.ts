import {UserStore} from '@/store/UserStore';
import {GET} from '@/utils/fetch/requests';

interface LoadSelfAchievementsOptions {
	force?: boolean;
}

/** Загружает достижения текущего пользователя; по умолчанию использует кэш стора */
export async function loadSelfAchievements(options: LoadSelfAchievementsOptions = {}) {
	const {force = false} = options;

	if (!force && UserStore.selfAchievementsLoaded && !UserStore.selfAchievementsStale) {
		return UserStore.selfAchievements;
	}

	const res = await GET('achievements', {auth: true});
	if (res.success) {
		UserStore.setSelfAchievements(res.data.data ?? []);
	}

	return UserStore.selfAchievements;
}
