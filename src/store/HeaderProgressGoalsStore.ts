import {makeAutoObservable} from 'mobx';

import {getGoalsInProgress, IGoalProgress} from '@/utils/api/goals';

class Store {
	goalsInProgress: IGoalProgress[] = [];

	isLoading = false;

	constructor() {
		makeAutoObservable(this);
	}

	setGoalsInProgress(goals: IGoalProgress[]) {
		this.goalsInProgress = goals;
	}

	setLoading(loading: boolean) {
		this.isLoading = loading;
	}

	get hasRegularGoalsToday() {
		return this.goalsInProgress.length > 0;
	}

	/** Количество целей в процессе (для бейджа в хедере) */
	get goalsCount(): number {
		return this.goalsInProgress.length;
	}

	async loadGoalsInProgress() {
		this.setLoading(true);
		try {
			const response = await getGoalsInProgress();
			if (response.success && response.data) {
				this.setGoalsInProgress(Array.isArray(response.data) ? response.data : []);
			} else {
				this.setGoalsInProgress([]);
			}
		} catch (error) {
			console.error('Ошибка загрузки целей в процессе:', error);
			this.setGoalsInProgress([]);
		} finally {
			this.setLoading(false);
		}
	}

	clear() {
		this.goalsInProgress = [];
	}
}

export const HeaderProgressGoalsStore = new Store();
