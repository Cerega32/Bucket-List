import {makeAutoObservable} from 'mobx';

import {getGoalsInProgress, IGoalProgress} from '@/entities/goal/api/goals';

class Store {
	goalsInProgress: IGoalProgress[] = [];

	/** Полное число целей в процессе с бэкенда (не длина текущей страницы) */
	totalCount = 0;

	isLoading = false;

	constructor() {
		makeAutoObservable(this);
	}

	setGoalsInProgress(goals: IGoalProgress[], totalCount?: number) {
		this.goalsInProgress = goals;
		if (typeof totalCount === 'number') {
			this.totalCount = totalCount;
		} else {
			this.totalCount = goals.length;
		}
	}

	setLoading(loading: boolean) {
		this.isLoading = loading;
	}

	get hasRegularGoalsToday() {
		return this.goalsCount > 0;
	}

	/** Полное количество целей в процессе (для фолбэка, если ещё нет counts в профиле) */
	get goalsCount(): number {
		return this.totalCount || this.goalsInProgress.length;
	}

	async loadGoalsInProgress() {
		this.setLoading(true);
		try {
			const response = await getGoalsInProgress();
			if (response.success && response.data) {
				const body = response.data;
				if (Array.isArray(body)) {
					this.setGoalsInProgress(body);
				} else {
					const list = Array.isArray(body.data) ? body.data : [];
					const total = body.totalCount ?? body.pagination?.totalItems ?? list.length;
					this.setGoalsInProgress(list, total);
				}
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
		this.totalCount = 0;
	}
}

export const HeaderProgressGoalsStore = new Store();
