import {FC} from 'react';

import {NotificationStore} from '@/store/NotificationStore';
import {OPERATOR_EMAIL} from '@/utils/legal/operatorInfo';

import './regular-goals-premium-limit-content.scss';

// Keep in sync with backend/goals/regular_goal_limits.py REGULAR_GOALS_PREMIUM_LIMIT_MESSAGE
export const REGULAR_GOALS_PREMIUM_LIMIT_TEXT =
	'Мы не ожидали, что ты будешь таким активным! Напиши нам — ' +
	'наши разработчики будут трудиться целую ночь, чтобы сделать для тебя больше слотов.';

const MAIL_SUBJECT = 'Запрос на больше слотов для регулярных целей';

export const getRegularGoalsPremiumLimitMailtoHref = (): string => {
	const subject = encodeURIComponent(MAIL_SUBJECT);
	return `mailto:${OPERATOR_EMAIL}?subject=${subject}`;
};

export const RegularGoalsPremiumLimitMessage: FC = () => (
	<span className="regular-goals-premium-limit__message">
		{REGULAR_GOALS_PREMIUM_LIMIT_TEXT}{' '}
		<a className="regular-goals-premium-limit__email" href={getRegularGoalsPremiumLimitMailtoHref()}>
			{OPERATOR_EMAIL}
		</a>
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
