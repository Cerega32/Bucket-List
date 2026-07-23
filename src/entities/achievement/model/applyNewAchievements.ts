import {IAchievement} from '@/entities/achievement/model/types';
import {HeaderNotificationsStore} from '@/entities/notification/model/HeaderNotificationsStore';
import {getUser} from '@/entities/user/api/getUser';
import {UserStore} from '@/entities/user/model/UserStore';
import {NotificationStore} from '@/shared/model/NotificationStore';

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
