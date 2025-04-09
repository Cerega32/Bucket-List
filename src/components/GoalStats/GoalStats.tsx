import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IGoalHealth} from '@/typings/dashboard';

import {Svg} from '../Svg/Svg';
import {Title} from '../Title/Title';

import './goal-stats.scss';

interface GoalStatsProps {
	className?: string;
	stats: IGoalHealth;
}

export const GoalStats: FC<GoalStatsProps> = ({className, stats}) => {
	const [block, element] = useBem('goal-stats', className);

	// Определение статуса "здоровья" целей
	const completedPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
	const expiredPercentage = stats.total > 0 ? Math.round((stats.expired / stats.total) * 100) : 0;
	const activePercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

	let healthStatus: {
		status: 'excellent' | 'good' | 'moderate' | 'poor';
		label: string;
		icon: string;
	};

	if (expiredPercentage > 30) {
		healthStatus = {
			status: 'poor',
			label: 'Требует внимания',
			icon: 'warning',
		};
	} else if (expiredPercentage > 10) {
		healthStatus = {
			status: 'moderate',
			label: 'Умеренно',
			icon: 'attention',
		};
	} else if (completedPercentage < 20) {
		healthStatus = {
			status: 'good',
			label: 'Начальный этап',
			icon: 'seedling',
		};
	} else {
		healthStatus = {
			status: 'excellent',
			label: 'Отлично',
			icon: 'star',
		};
	}

	return (
		<section className={block()}>
			<Title className={element('title')} tag="h3">
				Состояние целей
			</Title>

			<div className={element('health-indicator', {status: healthStatus.status})}>
				<Svg icon={healthStatus.icon} width="24px" height="24px" className={element('health-icon')} />
				<span className={element('health-label')}>{healthStatus.label}</span>
			</div>

			<div className={element('stats')}>
				<div className={element('stat-item')}>
					<div className={element('stat-header')}>
						<Svg icon="target" width="16px" height="16px" className={element('stat-icon', {active: true})} />
						<span className={element('stat-name')}>Активные</span>
						<span className={element('stat-value')}>{stats.active}</span>
					</div>
					<div className={element('progress-bar')}>
						<div className={element('progress-fill', {active: true})} style={{width: `${activePercentage}%`}} />
					</div>
				</div>

				<div className={element('stat-item')}>
					<div className={element('stat-header')}>
						<Svg icon="done" width="16px" height="16px" className={element('stat-icon', {completed: true})} />
						<span className={element('stat-name')}>Выполненные</span>
						<span className={element('stat-value')}>{stats.completed}</span>
					</div>
					<div className={element('progress-bar')}>
						<div className={element('progress-fill', {completed: true})} style={{width: `${completedPercentage}%`}} />
					</div>
				</div>

				<div className={element('stat-item')}>
					<div className={element('stat-header')}>
						<Svg icon="warning" width="16px" height="16px" className={element('stat-icon', {expired: true})} />
						<span className={element('stat-name')}>Просроченные</span>
						<span className={element('stat-value')}>{stats.expired}</span>
					</div>
					<div className={element('progress-bar')}>
						<div className={element('progress-fill', {expired: true})} style={{width: `${expiredPercentage}%`}} />
					</div>
				</div>
			</div>

			<div className={element('total')}>
				<span className={element('total-label')}>Всего целей:</span>
				<span className={element('total-value')}>{stats.total}</span>
			</div>

			{stats.total === 0 && (
				<div className={element('empty')}>
					<p>Добавьте свои первые цели, чтобы начать отслеживать прогресс</p>
				</div>
			)}
		</section>
	);
};
