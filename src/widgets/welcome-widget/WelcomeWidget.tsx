import {FC} from 'react';

import {IUserStats} from '@/entities/dashboard/model/types';
import {UserStore} from '@/entities/user/model/UserStore';
import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';
import {Title} from '@/shared/ui/Title/Title';

import '@/widgets/welcome-widget/welcome-widget.scss';

interface WelcomeWidgetProps {
	className?: string;
	quote: string;
	stats: IUserStats;
}

export const WelcomeWidget: FC<WelcomeWidgetProps> = ({className, quote, stats}) => {
	const [block, element] = useBem('welcome-widget', className);
	const {userInfo} = UserStore;

	// Определяем время суток
	const getTimeOfDay = (): string => {
		const hour = new Date().getHours();
		if (hour < 12) return 'утро';
		if (hour < 18) return 'день';
		return 'вечер';
	};

	return (
		<section className={block()}>
			<div className={element('user-info')}>
				<div className={element('avatar')}>
					{userInfo?.avatar ? (
						<img src={userInfo.avatar} alt={userInfo.firstName} className={element('avatar-img')} />
					) : (
						<div className={element('avatar-placeholder')}>
							{userInfo?.firstName.charAt(0)}
							{userInfo?.lastName.charAt(0)}
						</div>
					)}
				</div>
				<div className={element('greeting')}>
					<Title className={element('title')} tag="h1">
						Добрый {getTimeOfDay()}, {userInfo?.firstName}!
					</Title>
					<div className={element('stats')}>
						<div className={element('stat-item')}>
							<Svg icon="flame" width="16px" height="16px" className={element('stat-icon')} />
							<span className={element('stat-value')}>{stats.currentStreak} дн.</span>
							<span className={element('stat-label')}>стрик</span>
						</div>
						<div className={element('stat-item')}>
							<Svg icon="done" width="16px" height="16px" className={element('stat-icon')} />
							<span className={element('stat-value')}>{stats.completedGoals}</span>
							<span className={element('stat-label')}>выполнено</span>
						</div>
						<div className={element('stat-item')}>
							<Svg icon="trophy" width="16px" height="16px" className={element('stat-icon')} />
							<span className={element('stat-value')}>{stats.maxStreak} дн.</span>
							<span className={element('stat-label')}>макс. стрик</span>
						</div>
					</div>
				</div>
			</div>
			<div className={element('quote')}>
				<q>{quote}</q>
			</div>
		</section>
	);
};
