import {makeAutoObservable} from 'mobx';

import {UserStore} from '@/store/UserStore';
import {IRegularGoalStatistics} from '@/typings/goal';
import {getRegularGoalStatistics} from '@/utils/api/goals';
import {isPremiumSubscriptionActive} from '@/utils/regularGoal/isPremiumSubscriptionActive';
import {computeRegularGoalsHeaderStats} from '@/utils/regularGoal/regularGoalTodayVisibility';

const parseRegularGoalStatisticsList = (payload: unknown): IRegularGoalStatistics[] => {
	if (!payload || typeof payload !== 'object') {
		return [];
	}

	if (Array.isArray(payload)) {
		return payload;
	}

	const {data} = payload as {data?: IRegularGoalStatistics[]};
	return Array.isArray(data) ? data : [];
};

class Store {
	totalCount = 0;

	completedTodayCount = 0;

	needsAttention = false;

	isLoading = false;

	constructor() {
		makeAutoObservable(this);
	}

	setStats(total: number, completedToday: number, needsAttention = false) {
		this.totalCount = total;
		this.completedTodayCount = completedToday;
		this.needsAttention = needsAttention;
	}

	setLoading(loading: boolean) {
		this.isLoading = loading;
	}

	get hasRegularGoals() {
		return this.totalCount > 0;
	}

	get allCompletedToday() {
		return this.totalCount > 0 && this.completedTodayCount === this.totalCount;
	}

	async loadTodayCount(selectionPending = false) {
		this.setLoading(true);
		try {
			const response = await getRegularGoalStatistics();
			if (response.success && response.data) {
				const statistics = parseRegularGoalStatisticsList(response.data);
				const stats = computeRegularGoalsHeaderStats(
					statistics,
					selectionPending,
					UserStore.userSelf.regularGoalsSlotsLocked ?? false,
					isPremiumSubscriptionActive(UserStore.userSelf)
				);
				this.setStats(stats.totalCount, stats.completedTodayCount, stats.needsAttention);
			} else {
				this.setStats(0, 0, false);
			}
		} catch (error) {
			console.error('Ошибка загрузки количества регулярных целей:', error);
			this.setStats(0, 0, false);
		} finally {
			this.setLoading(false);
		}
	}

	clear() {
		this.totalCount = 0;
		this.completedTodayCount = 0;
		this.needsAttention = false;
	}
}

export const HeaderRegularGoalsStore = new Store();
