import {observer} from 'mobx-react-lite';
import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {ComparisonData, compareWithFriend} from '@/utils/api/friends/friendsApi';

import './page-friend-compare.scss';

interface PageFriendCompareProps {
	page: string;
}

export const PageFriendCompare: React.FC<PageFriendCompareProps> = observer(() => {
	const [block, element] = useBem('page-friend-compare');
	const {friendId} = useParams<{friendId: string}>();
	const navigate = useNavigate();
	const [comparison, setComparison] = useState<ComparisonData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Загрузка данных для сравнения
	useEffect(() => {
		const loadComparisonData = async () => {
			setIsLoading(true);
			setError(null);

			if (!friendId) {
				setError('Не указан ID друга для сравнения');
				setIsLoading(false);
				return;
			}

			try {
				const response = await compareWithFriend(parseInt(friendId, 10));
				if (response.success && response.data) {
					setComparison(response.data);
				} else {
					setError(response.error || 'Не удалось загрузить данные для сравнения');
				}
			} catch (err) {
				console.error('Ошибка при загрузке данных для сравнения:', err);
				setError('Произошла ошибка при загрузке данных для сравнения');
			} finally {
				setIsLoading(false);
			}
		};

		loadComparisonData();
	}, [friendId]);

	// Форматирование даты
	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'Нет данных';
		return new Date(dateString).toLocaleDateString('ru-RU');
	};

	// Определение кто выигрывает в конкретном показателе
	const getComparisonClass = (userValue: number, friendValue: number) => {
		if (userValue > friendValue) return 'winning';
		if (userValue < friendValue) return 'losing';
		return 'equal';
	};

	// Возврат к списку друзей
	const handleBackToFriends = () => {
		navigate('/user/self/friends');
	};

	return (
		<main className={block()}>
			<div className={element('header')}>
				<Button theme="blue-light" className={element('back-button')} onClick={handleBackToFriends} icon="arrow-left">
					К списку друзей
				</Button>
				<h1 className={element('title')}>Сравнение активности</h1>
			</div>

			<Loader isLoading={isLoading}>
				{error ? (
					<div className={element('error')}>{error}</div>
				) : comparison ? (
					<div className={element('comparison-container')}>
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
								<div className={element('user-avatar')}>
									{comparison.friend.first_name[0] || comparison.friend.username[0]}
								</div>
								<div className={element('user-name')}>
									{comparison.friend.first_name} {comparison.friend.last_name}
									<span className={element('user-username')}>@{comparison.friend.username}</span>
								</div>
								<div className={element('user-label')}>Ваш друг</div>
							</div>
						</div>

						<div className={element('stats-grid')}>
							<div className={element('stat-row')}>
								<div className={element('stat-label')}>Выполнено целей</div>
								<div
									className={element('stat-value', {
										[getComparisonClass(
											comparison.user.activity.goals_completed,
											comparison.friend.activity.goals_completed
										)]: true,
									})}
								>
									{comparison.user.activity.goals_completed}
								</div>
								<div
									className={element('stat-value', {
										[getComparisonClass(
											comparison.friend.activity.goals_completed,
											comparison.user.activity.goals_completed
										)]: true,
									})}
								>
									{comparison.friend.activity.goals_completed}
								</div>
							</div>

							<div className={element('stat-row')}>
								<div className={element('stat-label')}>Выполнено списков</div>
								<div
									className={element('stat-value', {
										[getComparisonClass(
											comparison.user.activity.lists_completed,
											comparison.friend.activity.lists_completed
										)]: true,
									})}
								>
									{comparison.user.activity.lists_completed}
								</div>
								<div
									className={element('stat-value', {
										[getComparisonClass(
											comparison.friend.activity.lists_completed,
											comparison.user.activity.lists_completed
										)]: true,
									})}
								>
									{comparison.friend.activity.lists_completed}
								</div>
							</div>

							<div className={element('stat-row')}>
								<div className={element('stat-label')}>Всего выполнений</div>
								<div
									className={element('stat-value', {
										[getComparisonClass(
											comparison.user.activity.total_completed,
											comparison.friend.activity.total_completed
										)]: true,
									})}
								>
									{comparison.user.activity.total_completed}
								</div>
								<div
									className={element('stat-value', {
										[getComparisonClass(
											comparison.friend.activity.total_completed,
											comparison.user.activity.total_completed
										)]: true,
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
								<div className={element('summary-message', {winning: true})}>
									Поздравляем! Вы опережаете вашего друга по количеству выполнений!
								</div>
							) : comparison.user.activity.total_completed < comparison.friend.activity.total_completed ? (
								<div className={element('summary-message', {losing: true})}>
									Ваш друг опережает вас по количеству выполнений. Не отставайте!
								</div>
							) : (
								<div className={element('summary-message', {equal: true})}>
									У вас с другом равное количество выполнений. Отличная гонка!
								</div>
							)}
						</div>
					</div>
				) : null}
			</Loader>
		</main>
	);
});
