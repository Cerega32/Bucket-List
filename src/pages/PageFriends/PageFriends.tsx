import {observer} from 'mobx-react-lite';
import React, {useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {FriendsSearch} from '@/components/FriendsSearch/FriendsSearch';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {Friend, FriendRequest, getFriendRequests, getFriends, removeFriend, respondToFriendRequest} from '@/utils/api/friends/friendsApi';

import './page-friends.scss';

interface PageFriendsProps {
	page: string;
}

export const PageFriends: React.FC<PageFriendsProps> = observer(() => {
	const [block, element] = useBem('page-friends');
	const [friends, setFriends] = useState<Friend[]>([]);
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
	const [isLoadingFriends, setIsLoadingFriends] = useState(false);
	const [isLoadingRequests, setIsLoadingRequests] = useState(false);
	const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

	// Загрузка списка друзей
	const loadFriends = async () => {
		setIsLoadingFriends(true);
		try {
			const response = await getFriends();
			if (response.success && response.data) {
				setFriends(response.data);
			}
		} catch (error) {
			console.error('Ошибка при загрузке списка друзей:', error);
		} finally {
			setIsLoadingFriends(false);
		}
	};

	// Загрузка запросов на дружбу
	const loadFriendRequests = async () => {
		setIsLoadingRequests(true);
		try {
			const response = await getFriendRequests();
			if (response.success && response.data) {
				setFriendRequests(response.data);
			}
		} catch (error) {
			console.error('Ошибка при загрузке запросов на дружбу:', error);
		} finally {
			setIsLoadingRequests(false);
		}
	};

	// Удаление друга
	const handleRemoveFriend = async (friendId: number) => {
		try {
			const response = await removeFriend(friendId);
			if (response.success) {
				// Обновляем список друзей
				setFriends(friends.filter((friend) => friend.id !== friendId));
			}
		} catch (error) {
			console.error('Ошибка при удалении друга:', error);
		}
	};

	// Ответ на запрос дружбы
	const handleRespondToRequest = async (requestId: number, action: 'accept' | 'reject') => {
		try {
			const response = await respondToFriendRequest(requestId, action);
			if (response.success) {
				// Удаляем запрос из списка
				setFriendRequests(friendRequests.filter((request) => request.id !== requestId));

				// Если запрос был принят, обновляем список друзей
				if (action === 'accept') {
					loadFriends();
				}
			}
		} catch (error) {
			console.error('Ошибка при ответе на запрос дружбы:', error);
		}
	};

	// Обработчик после отправки запроса на дружбу
	const handleAfterSendRequest = () => {
		// Обновляем списки после отправки запроса
		loadFriends();
		loadFriendRequests();
	};

	useEffect(() => {
		loadFriends();
		loadFriendRequests();
	}, []);

	return (
		<main className={block()}>
			<h1 className={element('title')}>Мои друзья</h1>

			<div className={element('search-container')}>
				<FriendsSearch onSendRequest={handleAfterSendRequest} />
			</div>

			<div className={element('tabs')}>
				<button type="button" className={element('tab', {active: activeTab === 'friends'})} onClick={() => setActiveTab('friends')}>
					Друзья {friends.length > 0 && <span className={element('count')}>{friends.length}</span>}
				</button>
				<button
					type="button"
					className={element('tab', {active: activeTab === 'requests'})}
					onClick={() => setActiveTab('requests')}
				>
					Запросы {friendRequests.length > 0 && <span className={element('count')}>{friendRequests.length}</span>}
				</button>
			</div>

			<div className={element('content')}>
				{activeTab === 'friends' && (
					<Loader isLoading={isLoadingFriends}>
						{friends.length === 0 ? (
							<div className={element('empty-state')}>
								<p>У вас пока нет друзей.</p>
								<p>Воспользуйтесь поиском выше, чтобы найти пользователей.</p>
							</div>
						) : (
							<ul className={element('friends-list')}>
								{friends.map((friend) => (
									<li key={friend.id} className={element('friend-item')}>
										<div className={element('friend-info')}>
											<div className={element('friend-avatar')}>{friend.first_name[0] || friend.username[0]}</div>
											<div className={element('friend-details')}>
												<div className={element('friend-name')}>
													{friend.first_name} {friend.last_name}
													<span className={element('friend-username')}>@{friend.username}</span>
												</div>
												<div className={element('friend-since')}>
													В друзьях с {new Date(friend.created_at).toLocaleDateString('ru-RU')}
												</div>
											</div>
										</div>
										<div className={element('friend-actions')}>
											<Button
												theme="blue"
												className={element('action-button')}
												type="Link"
												href={`/friends/compare/${friend.id}`}
											>
												Сравнить
											</Button>
											<Button
												theme="red"
												className={element('action-button')}
												onClick={() => handleRemoveFriend(friend.id)}
											>
												Удалить
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</Loader>
				)}

				{activeTab === 'requests' && (
					<Loader isLoading={isLoadingRequests}>
						{friendRequests.length === 0 ? (
							<div className={element('empty-state')}>
								<p>У вас нет запросов на дружбу.</p>
							</div>
						) : (
							<ul className={element('requests-list')}>
								{friendRequests.map((request) => (
									<li key={request.id} className={element('request-item')}>
										<div className={element('friend-info')}>
											<div className={element('friend-avatar')}>{request.first_name[0] || request.username[0]}</div>
											<div className={element('friend-details')}>
												<div className={element('friend-name')}>
													{request.first_name} {request.last_name}
													<span className={element('friend-username')}>@{request.username}</span>
												</div>
												<div className={element('request-date')}>
													Запрос от {new Date(request.created_at).toLocaleDateString('ru-RU')}
												</div>
											</div>
										</div>
										<div className={element('request-actions')}>
											<Button
												theme="green"
												className={element('action-button')}
												onClick={() => handleRespondToRequest(request.id, 'accept')}
											>
												Принять
											</Button>
											<Button
												theme="red"
												className={element('action-button')}
												onClick={() => handleRespondToRequest(request.id, 'reject')}
											>
												Отклонить
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</Loader>
				)}
			</div>
		</main>
	);
});
