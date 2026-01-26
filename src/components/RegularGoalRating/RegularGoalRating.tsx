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
	maxStreak: number;
	completedSeriesCount: number;
	place: number;
}

interface RegularGoalRatingProps {
	regularGoalId: number;
	className?: string;
}

export const RegularGoalRating: FC<RegularGoalRatingProps> = ({regularGoalId, className}) => {
	const [block, element] = useBem('regular-goal-rating', className);
	const [users, setUsers] = useState<RegularGoalRatingUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadRating = async () => {
			setIsLoading(true);
			try {
				const response = await getRegularGoalRating(regularGoalId);

				if (response.success && response.data) {
					// GET возвращает: { success: true, data: <ответ сервера> }
					// Сервер возвращает: { success: true, data: { users: [...] } }
					// После GET: response.data = { success: true, data: { users: [...] } }
					// Итого: response.data.data.users
					let usersArray: RegularGoalRatingUser[] = [];

					// Если response.data содержит data.users (вложенная структура от сервера)
					if (
						(response.data as any).data &&
						(response.data as any).data.users &&
						Array.isArray((response.data as any).data.users)
					) {
						usersArray = (response.data as any).data.users;
					}
					// Если response.data уже содержит users напрямую (fallback)
					else if (Array.isArray((response.data as any).users)) {
						usersArray = (response.data as any).users;
					}

					setUsers(usersArray);
				} else {
					console.warn('📊 Рейтинг: ответ не успешен или нет данных', response);
				}
			} catch (error) {
				console.error('Ошибка при загрузке рейтинга:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadRating();
	}, [regularGoalId]);

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

	return (
		<section className={block()}>
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
					{users.map((user) => (
						<tr className={element('row')} key={user.id}>
							<td className={element('item')}>{user.place}</td>
							<td className={element('item')}>
								<Link to={`/user/${user.id}/showcase`} className={element('row-link')}>
									<Avatar noBorder className={element('avatar')} size="medium" avatar={user.avatar} />
									<p>{user.name}</p>
								</Link>
							</td>
							<td className={element('item')}>{user.maxStreak}</td>
							<td className={element('item')}>{user.completedSeriesCount}</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
};
