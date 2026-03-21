/**
 * Константы для работы с целями
 */

// Максимальная длина заголовка цели (соответствует max_length в backend/goals/models.py)
export const GOAL_TITLE_MAX_LENGTH = 200;
export const GOAL_TITLE_MIN_LENGTH = 3;

/** Минимальная длина названия списка целей */
export const GOAL_LIST_TITLE_MIN_LENGTH = 3;

export const GOAL_TITLE_EMPTY_ERROR = 'Введите название цели';
export const GOAL_TITLE_TOO_SHORT_ERROR = `Минимальная длина названия цели - ${GOAL_TITLE_MIN_LENGTH} символа`;

export const GOAL_LIST_TITLE_EMPTY_ERROR = 'Введите название списка';
export const GOAL_LIST_TITLE_TOO_SHORT_ERROR = `Минимальная длина названия списка - ${GOAL_LIST_TITLE_MIN_LENGTH} символа`;

/** Ошибки поля названия цели для FieldInput */
export function getGoalTitleFieldErrors(showErrors: boolean, title: string): boolean | string[] {
	if (!showErrors) return false;
	const t = title.trim();
	if (!t) return [GOAL_TITLE_EMPTY_ERROR];
	if (t.length < GOAL_TITLE_MIN_LENGTH) return [GOAL_TITLE_TOO_SHORT_ERROR];
	return false;
}

/** Ошибки поля названия списка целей */
export function getGoalListTitleFieldErrors(showErrors: boolean, title: string): boolean | string[] {
	if (!showErrors) return false;
	const t = title.trim();
	if (!t) return [GOAL_LIST_TITLE_EMPTY_ERROR];
	if (t.length < GOAL_LIST_TITLE_MIN_LENGTH) return [GOAL_LIST_TITLE_TOO_SHORT_ERROR];
	return false;
}

export function isGoalTitleInvalid(title: string): boolean {
	const t = title.trim();
	return !t || t.length < GOAL_TITLE_MIN_LENGTH;
}

export function isGoalListTitleInvalid(title: string): boolean {
	const t = title.trim();
	return !t || t.length < GOAL_LIST_TITLE_MIN_LENGTH;
}
