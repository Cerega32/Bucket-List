import {HeaderProgressGoalsStore} from '@/entities/goal/model/HeaderProgressGoalsStore';
import {HeaderRegularGoalsStore} from '@/entities/regular-goal/model/HeaderRegularGoalsStore';
import {getUser} from '@/entities/user/api/getUser';
import {UserStore} from '@/entities/user/model/UserStore';

/** После удаления цели/списка: актуальные counts в профиле и бейджи прогресса/регулярок в шапке */
export async function refreshHeaderGoalCounts(): Promise<void> {
	await getUser();
	await Promise.all([
		HeaderProgressGoalsStore.loadGoalsInProgress(),
		HeaderRegularGoalsStore.loadTodayCount(UserStore.userSelf.regularGoalsSelectionPending ?? false),
	]);
}
