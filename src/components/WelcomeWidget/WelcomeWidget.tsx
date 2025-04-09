import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {UserStore} from '@/store/UserStore';
import {IUserStats} from '@/typings/dashboard';

import {Svg} from '../Svg/Svg';
import {Title} from '../Title/Title';

import './welcome-widget.scss';

interface WelcomeWidgetProps {
	className?: string;
	quote: string;
	stats: IUserStats;
}

export const WelcomeWidget: FC<WelcomeWidgetProps> = ({className, quote, stats}) => {
	const [block, element] = useBem('welcome-widget', className);
	const {user} = UserStore;

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
					{user?.avatar ? (
						<img src={user.avatar} alt={user.firstName} className={element('avatar-img')} />
					) : (
						<div className={element('avatar-placeholder')}>
							{user?.firstName.charAt(0)}
							{user?.lastName.charAt(0)}
						</div>
					)}
				</div>
				<div className={element('greeting')}>
					<Title className={element('title')} tag="h1">
						Добрый {getTimeOfDay()}, {user?.firstName}!
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
