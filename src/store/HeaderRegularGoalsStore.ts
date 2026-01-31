import {makeAutoObservable} from 'mobx';

import {getRegularGoalStatistics} from '@/utils/api/goals';

function isForToday(stat: {canCompleteToday: boolean; isActive: boolean; currentPeriodProgress?: {completedToday?: boolean}}) {
	return stat.isActive && (stat.canCompleteToday || stat.currentPeriodProgress?.completedToday === true);
}

function isCompletedToday(stat: {currentPeriodProgress?: {completedToday?: boolean}}) {
	return stat.currentPeriodProgress?.completedToday === true;
}

class Store {
	todayCount = 0;

	completedTodayCount = 0;

	isLoading = false;

	constructor() {
		makeAutoObservable(this);
	}

	setTodayStats(count: number, completedCount: number) {
		this.todayCount = count;
		this.completedTodayCount = completedCount;
	}

	setLoading(loading: boolean) {
		this.isLoading = loading;
	}

	get hasRegularGoalsToday() {
		return this.todayCount > 0;
	}

	get allCompletedToday() {
		return this.todayCount > 0 && this.completedTodayCount === this.todayCount;
	}

	async loadTodayCount() {
		this.setLoading(true);
		try {
			const response = await getRegularGoalStatistics();
			if (response.success && response.data) {
				const statistics = Array.isArray(response.data) ? response.data : response.data.data;
				const forToday = statistics.filter(isForToday);
				const completed = forToday.filter(isCompletedToday);
				this.setTodayStats(forToday.length, completed.length);
			} else {
				this.setTodayStats(0, 0);
			}
		} catch (error) {
			console.error('Ошибка загрузки количества регулярных целей:', error);
			this.setTodayStats(0, 0);
		} finally {
			this.setLoading(false);
		}
	}

	clear() {
		this.todayCount = 0;
		this.completedTodayCount = 0;
	}
}

export const HeaderRegularGoalsStore = new Store();
