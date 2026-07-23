import {FC} from 'react';
import {Link} from 'react-router-dom';

import {
	REGULAR_GOALS_CONTACTS_PATH,
	REGULAR_GOALS_PREMIUM_LIMIT_LEAD,
	REGULAR_GOALS_PREMIUM_LIMIT_TAIL,
} from '@/entities/regular-goal/lib/regularGoalsPremiumLimitContent';
import {NotificationStore} from '@/shared/model/NotificationStore';

import '@/entities/regular-goal/ui/RegularGoalsPremiumLimitMessage/regular-goals-premium-limit-message.scss';

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
