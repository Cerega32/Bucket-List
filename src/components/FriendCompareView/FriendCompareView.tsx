import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {ComparisonData} from '@/utils/api/friends/friendsApi';

import './friend-compare-view.scss';

interface FriendCompareViewProps {
	className?: string;
	comparison: ComparisonData;
}

const formatDate = (dateString: string | null) => {
	if (!dateString) return 'Нет данных';
	return new Date(dateString).toLocaleDateString('ru-RU');
};

const getComparisonClass = (userValue: number, friendValue: number) => {
	if (userValue > friendValue) return 'winning';
	if (userValue < friendValue) return 'losing';
	return 'equal';
};

export const FriendCompareView: FC<FriendCompareViewProps> = (props) => {
	const {className, comparison} = props;
	const [block, element] = useBem('friend-compare-view', className);

	return (
		<div className={block()}>
			<div className={element('users-header')}>
				<div className={element('user-card')}>
					<div className={element('user-avatar')}>{comparison.user.first_name[0] || comparison.user.username[0]}</div>
					<div className={element('user-name')}>
						{comparison.user.first_name} {comparison.user.last_name}
						<span className={element('user-username')}>@{comparison.user.username}</span>
					</div>
					<div className={element('user-label')}>Вы</div>
				</div>
				<div className={element('vs')}>VS</div>
				<div className={element('user-card')}>
					<div className={element('user-avatar')}>{comparison.friend.first_name[0] || comparison.friend.username[0]}</div>
					<div className={element('user-name')}>
						{comparison.friend.first_name} {comparison.friend.last_name}
						<span className={element('user-username')}>@{comparison.friend.username}</span>
					</div>
					<div className={element('user-label')}>Друг</div>
				</div>
			</div>

			<div className={element('stats-grid')}>
				<div className={element('stat-row')}>
					<div className={element('stat-label')}>Выполнено целей</div>
					<div
						className={element('stat-value', {
							[getComparisonClass(comparison.user.activity.goals_completed, comparison.friend.activity.goals_completed)]:
								true,
						})}
					>
						{comparison.user.activity.goals_completed}
					</div>
					<div
						className={element('stat-value', {
							[getComparisonClass(comparison.friend.activity.goals_completed, comparison.user.activity.goals_completed)]:
								true,
						})}
					>
						{comparison.friend.activity.goals_completed}
					</div>
				</div>

				<div className={element('stat-row')}>
					<div className={element('stat-label')}>Выполнено списков</div>
					<div
						className={element('stat-value', {
							[getComparisonClass(comparison.user.activity.lists_completed, comparison.friend.activity.lists_completed)]:
								true,
						})}
					>
						{comparison.user.activity.lists_completed}
					</div>
					<div
						className={element('stat-value', {
							[getComparisonClass(comparison.friend.activity.lists_completed, comparison.user.activity.lists_completed)]:
								true,
						})}
					>
						{comparison.friend.activity.lists_completed}
					</div>
				</div>

				<div className={element('stat-row')}>
					<div className={element('stat-label')}>Всего выполнений</div>
					<div
						className={element('stat-value', {
							[getComparisonClass(comparison.user.activity.total_completed, comparison.friend.activity.total_completed)]:
								true,
						})}
					>
						{comparison.user.activity.total_completed}
					</div>
					<div
						className={element('stat-value', {
							[getComparisonClass(comparison.friend.activity.total_completed, comparison.user.activity.total_completed)]:
								true,
						})}
					>
						{comparison.friend.activity.total_completed}
					</div>
				</div>

				<div className={element('stat-row')}>
					<div className={element('stat-label')}>Последнее выполнение</div>
					<div className={element('stat-value')}>{formatDate(comparison.user.activity.latest_completion)}</div>
					<div className={element('stat-value')}>{formatDate(comparison.friend.activity.latest_completion)}</div>
				</div>
			</div>

			<div className={element('summary')}>
				{comparison.user.activity.total_completed > comparison.friend.activity.total_completed ? (
					<div className={element('summary-message', {winning: true})}>Вы опережаете друга по количеству выполнений</div>
				) : comparison.user.activity.total_completed < comparison.friend.activity.total_completed ? (
					<div className={element('summary-message', {losing: true})}>Друг опережает вас — самое время догнать</div>
				) : (
					<div className={element('summary-message', {equal: true})}>Равный темп — отличная гонка</div>
				)}
			</div>
		</div>
	);
};
