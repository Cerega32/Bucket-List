import {FC, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {getRegularGoalRating} from '@/utils/api/goals';

import {Avatar} from '../Avatar/Avatar';
import {EmptyState} from '../EmptyState/EmptyState';

import './regular-goal-rating.scss';

interface RegularGoalRatingUser {
	id: number;
	username: string;
	name: string;
	avatar: string | null;
	level: number;
	completedGoalsCount: number;
	maxStreak: number;
	completedSeriesCount: number;
	place: number;
}

interface RegularGoalRatingProps {
	regularGoalId: number;
	className?: string;
	refreshTrigger?: number;
}

const getPlaceModifier = (place: number): string | undefined => {
	if (place === 1) return 'gold';
	if (place === 2) return 'silver';
	if (place === 3) return 'bronze';
	return undefined;
};

export const RegularGoalRating: FC<RegularGoalRatingProps> = ({regularGoalId, className, refreshTrigger}) => {
	const [block, element] = useBem('regular-goal-rating', className);
	const [users, setUsers] = useState<RegularGoalRatingUser[]>([]);
	const [, setCurrentUserId] = useState<number | null>(null);
	const [currentExecution, setCurrentExecution] = useState<RegularGoalRatingUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadRating = async () => {
			setIsLoading(true);
			try {
				const response = await getRegularGoalRating(regularGoalId);

				if (response.success && response.data) {
					let usersArray: RegularGoalRatingUser[] = [];
					let userId: number | null = null;
					let execution: RegularGoalRatingUser | null = null;

					const serverData = (response.data as any).data || response.data;

					if (Array.isArray(serverData.users)) {
						usersArray = serverData.users;
					}
					if (serverData.currentUserId) {
						userId = serverData.currentUserId;
					}
					if (serverData.currentExecution) {
						execution = serverData.currentExecution;
					}

					setUsers(usersArray);
					setCurrentUserId(userId);
					setCurrentExecution(execution);
				}
			} catch (error) {
				console.error('Ошибка при загрузке рейтинга:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadRating();
	}, [regularGoalId, refreshTrigger]);

	if (isLoading) {
		return (
			<section className={block()}>
				<div className={element('loading')}>Загрузка рейтинга...</div>
			</section>
		);
	}

	if (users.length === 0) {
		return (
			<section className={block()}>
				<EmptyState
					title="Рейтинг пока пуст"
					description="Рейтинг появится, когда хотя бы один пользователь начнет выполнять эту цель"
				/>
			</section>
		);
	}

	const renderRow = (user: RegularGoalRatingUser, isCurrentExecution: boolean) => {
		const placeModifier = getPlaceModifier(user.place);
		return (
			<tr
				className={element('row', {...(placeModifier ? {[placeModifier]: true} : {})})}
				key={isCurrentExecution ? `exec-${user.id}` : user.id}
			>
				<td className={element('item')}>
					<span
						className={element('place', {
							...(isCurrentExecution ? {current: true} : placeModifier ? {[placeModifier]: true} : {}),
						})}
					>
						{user.place}
					</span>
				</td>
				<td className={element('item')}>
					<Link to={`/user/${user.id}/showcase`} className={element('row-link')}>
						<Avatar noBorder className={element('avatar')} size="medium" avatar={user.avatar} />
						<p className={element('user-name')}>{user.name}</p>
						<p className={element('user-info')}>
							{user.level} уровень {user.completedGoalsCount} целей выполнено
						</p>
					</Link>
				</td>
				<td className={element('item')}>{user.maxStreak}</td>
				<td className={element('item')}>{user.completedSeriesCount}</td>
			</tr>
		);
	};

	return (
		<section className={block()}>
			<div className={element('board')}>
				<table className={element('table')}>
					<thead className={element('header')}>
						<tr>
							<th className={element('head-item')}>#</th>
							<th className={element('head-item')}>Пользователь</th>
							<th className={element('head-item')}>Максимальная серия</th>
							<th className={element('head-item')}>Выполнено раз</th>
						</tr>
					</thead>
					<tbody>
						{users.map((user) => renderRow(user, false))}
						{currentExecution && (
							<>
								<tr className={element('separator')}>
									<td colSpan={4} aria-label="Разделитель">
										<div className={element('dots')}>
											<span className={element('dot')} />
											<span className={element('dot')} />
											<span className={element('dot')} />
										</div>
									</td>
								</tr>
								{renderRow(currentExecution, true)}
							</>
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
};
