import {makeAutoObservable} from 'mobx';

import {getGoalsInProgress, IGoalProgress} from '@/utils/api/goals';

/** Массив из ответа GET self/goals-in-progress (корень или { data }) */
function goalsInProgressListFromResponse(body: unknown): IGoalProgress[] {
	if (!body || typeof body !== 'object') {
		return [];
	}
	if (Array.isArray(body)) {
		return body as IGoalProgress[];
	}
	const raw = (body as Record<string, unknown>)['data'];
	return Array.isArray(raw) ? (raw as IGoalProgress[]) : [];
}

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
		return this.goalsCount > 0;
	}

	/** Длина загруженной страницы (для фолбэка, если ещё нет counts в профиле) */
	get goalsCount(): number {
		return this.goalsInProgress.length;
	}

	async loadGoalsInProgress() {
		this.setLoading(true);
		try {
			const response = await getGoalsInProgress();
			if (response.success && response.data) {
				this.setGoalsInProgress(goalsInProgressListFromResponse(response.data));
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
