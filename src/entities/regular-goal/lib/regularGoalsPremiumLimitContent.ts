import {OPERATOR_EMAIL} from '@/shared/config/legal/operatorInfo';

export const REGULAR_GOALS_CONTACTS_PATH = '/contacts';

// Keep in sync with backend/goals/regular_goal_limits.py REGULAR_GOALS_PREMIUM_LIMIT_MESSAGE
export const REGULAR_GOALS_PREMIUM_LIMIT_LEAD = 'Мы не ожидали, что ты будешь таким активным! Напиши нам через ';

export const REGULAR_GOALS_PREMIUM_LIMIT_TAIL = ' — наши разработчики будут трудиться целую ночь, чтобы сделать для тебя больше слотов.';

export const REGULAR_GOALS_PREMIUM_LIMIT_TEXT = `${REGULAR_GOALS_PREMIUM_LIMIT_LEAD}раздел «Контакты»${REGULAR_GOALS_PREMIUM_LIMIT_TAIL}`;

export const REGULAR_GOALS_PREMIUM_LIMIT_MODAL_TEXT =
	'Мы не ожидали, что ты будешь таким активным! Напиши нам — ' +
	'наши разработчики будут трудиться целую ночь, чтобы сделать для тебя больше слотов.';

const MAIL_SUBJECT = 'Запрос на больше слотов для регулярных целей';

export const getRegularGoalsPremiumLimitMailtoHref = (): string => {
	const subject = encodeURIComponent(MAIL_SUBJECT);
	return `mailto:${OPERATOR_EMAIL}?subject=${subject}`;
};
