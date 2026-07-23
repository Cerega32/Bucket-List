type HeaderGoalCountsRefreshHandler = () => void | Promise<void>;

let handler: HeaderGoalCountsRefreshHandler | null = null;

export const registerHeaderGoalCountsRefresh = (fn: HeaderGoalCountsRefreshHandler): (() => void) => {
	handler = fn;
	return () => {
		if (handler === fn) {
			handler = null;
		}
	};
};

export const scheduleHeaderGoalCountsRefresh = (): void => {
	if (!handler) {
		return;
	}

	Promise.resolve(handler()).catch(() => undefined);
};
