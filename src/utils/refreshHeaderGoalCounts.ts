import {HeaderProgressGoalsStore} from '@/store/HeaderProgressGoalsStore';
import {HeaderRegularGoalsStore} from '@/store/HeaderRegularGoalsStore';
import {getUser} from '@/utils/api/get/getUser';

/** После удаления цели/списка: актуальные counts в профиле и бейджи прогресса/регулярок в шапке */
export async function refreshHeaderGoalCounts(): Promise<void> {
	await Promise.all([getUser(), HeaderProgressGoalsStore.loadGoalsInProgress(), HeaderRegularGoalsStore.loadTodayCount()]);
}
