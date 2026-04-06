import {makeAutoObservable} from 'mobx';

import {getRegularGoalStatistics} from '@/utils/api/goals';

class Store {
	totalCount = 0;

	completedTodayCount = 0;

	isLoading = false;

	constructor() {
		makeAutoObservable(this);
	}

	setStats(total: number, completedToday: number) {
		this.totalCount = total;
		this.completedTodayCount = completedToday;
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

	async loadTodayCount() {
		this.setLoading(true);
		try {
			const response = await getRegularGoalStatistics();
			if (response.success && response.data) {
				const statistics = Array.isArray(response.data) ? response.data : response.data.data;
				const active = statistics.filter((s: {isActive: boolean}) => s.isActive);
				const completedToday = active.filter(
					(s: {isInterrupted?: boolean; currentPeriodProgress?: {completedToday?: boolean}}) =>
						!s.isInterrupted && s.currentPeriodProgress?.completedToday === true
				);
				this.setStats(active.length, completedToday.length);
			} else {
				this.setStats(0, 0);
			}
		} catch (error) {
			console.error('Ошибка загрузки количества регулярных целей:', error);
			this.setStats(0, 0);
		} finally {
			this.setLoading(false);
		}
	}

	clear() {
		this.totalCount = 0;
		this.completedTodayCount = 0;
	}
}

export const HeaderRegularGoalsStore = new Store();
