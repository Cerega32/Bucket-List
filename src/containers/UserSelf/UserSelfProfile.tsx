import {observer} from 'mobx-react-lite';
import {FC} from 'react';

import {Avatar} from '@/components/Avatar/Avatar';
import {Button} from '@/components/Button/Button';
import {Line} from '@/components/Line/Line';
import {Tag} from '@/components/Tag/Tag';
import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {pluralize} from '@/utils/text/pluralize';

interface UserSelfProfileProps {
	hideSubscriptionButton?: boolean;
	noBorder?: boolean;
}

export const UserSelfProfile: FC<UserSelfProfileProps> = observer(({hideSubscriptionButton = false, noBorder = false}) => {
	const [, element] = useBem('user-self');
	const {userSelf} = UserStore;

	const displayName = userSelf.name || userSelf.firstName || userSelf.username || 'Пользователь';
	const userLevel = (userSelf as any).level || 0;
	const completedGoals = userSelf.totalCompletedGoals || 0;
	const isPremium = userSelf.subscriptionType === 'premium';

	return (
		<div className={element('profile', {noBorder})}>
			<div className={element('profile-header')}>
				<Avatar avatar={userSelf.avatar} size="medium" className={element('profile-avatar')} />
				<div className={element('profile-info')}>
					<div className={element('profile-name')}>{displayName}</div>
					<div className={element('profile-stats')}>
						{pluralize(userLevel, ['уровень', 'уровня', 'уровней'])} · {pluralize(completedGoals, ['цель', 'цели', 'целей'])}{' '}
						выполнено
					</div>
				</div>
				<Tag
					text={isPremium ? 'Premium' : 'Free'}
					theme={isPremium ? undefined : 'light'}
					className={element('profile-subscription-badge', {premium: isPremium})}
				/>
			</div>
			<Line className={element('profile-line')} />
			{!hideSubscriptionButton && (
				<Button
					type="Link"
					href="/user/self/subs"
					theme="no-border"
					size="medium"
					icon="rocket"
					className={element('profile-premium-btn')}
				>
					{isPremium ? 'Подписка' : 'Купить премиум'}
				</Button>
			)}
		</div>
	);
});
