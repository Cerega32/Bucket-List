import {HeaderNotificationsStore} from '@/store/HeaderNotificationsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {UserStore} from '@/store/UserStore';
import {IAchievement} from '@/typings/achievements';
import {getUser} from '@/utils/api/get/getUser';

/** Обрабатывает новые достижения после мутации: тост, патч стора, счётчики */
export async function applyNewAchievements(newAchievements?: IAchievement[] | null): Promise<void> {
	if (!newAchievements?.length) {
		return;
	}

	newAchievements.forEach((achievement) => {
		NotificationStore.addNotification({
			type: 'success',
			title: 'Новое достижение!',
			message: `Вы получили достижение «${achievement.title}»`,
		});
	});

	if (UserStore.selfAchievementsLoaded) {
		UserStore.mergeSelfAchievements(newAchievements);
	} else {
		UserStore.markSelfAchievementsStale();
	}

	const userId = String(UserStore.userSelf.id);
	if (userId && UserStore.achievementsLoadedForId === userId) {
		UserStore.setAchievementsLoadedForId(null);
	}
	if (userId && UserStore.showcaseLoadedForId === userId) {
		UserStore.setShowcaseLoadedForId(null);
	}

	await Promise.all([getUser(), HeaderNotificationsStore.fetchUnreadCount()]);
}
