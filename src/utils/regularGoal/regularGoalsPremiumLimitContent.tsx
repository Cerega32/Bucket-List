import {FC} from 'react';
import {Link} from 'react-router-dom';

import {NotificationStore} from '@/store/NotificationStore';
import {OPERATOR_EMAIL} from '@/utils/legal/operatorInfo';

import './regular-goals-premium-limit-content.scss';

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

export const RegularGoalsPremiumLimitMessage: FC = () => (
	<span className="regular-goals-premium-limit__message">
		{REGULAR_GOALS_PREMIUM_LIMIT_LEAD}
		<Link className="regular-goals-premium-limit__link" to={REGULAR_GOALS_CONTACTS_PATH}>
			раздел «Контакты»
		</Link>
		{REGULAR_GOALS_PREMIUM_LIMIT_TAIL}
	</span>
);

export const notifyRegularGoalsPremiumLimitReached = (): void => {
	NotificationStore.addNotification({
		type: 'warning',
		title: 'Лимит достигнут',
		message: <RegularGoalsPremiumLimitMessage />,
		duration: 12000,
	});
};
