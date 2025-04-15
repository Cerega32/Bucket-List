import React, {useState} from 'react';

import {Button} from '@/components/Button/Button';
import {Loader} from '@/components/Loader/Loader';
import {Svg} from '@/components/Svg/Svg';
import {useBem} from '@/hooks/useBem';
import {searchUsers, sendFriendRequest, User} from '@/utils/api/friends/friendsApi';
import './friends-search.scss';

interface FriendsSearchProps {
	className?: string;
	onSendRequest?: () => void;
}

export const FriendsSearch: React.FC<FriendsSearchProps> = ({className = '', onSendRequest}) => {
	const [block, element] = useBem('friends-search', className);
	const [query, setQuery] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [pendingRequests, setPendingRequests] = useState<number[]>([]);
	const [error, setError] = useState<string | null>(null);

	// Обработчик изменения поискового запроса
	const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value);
		// Очищаем результаты и ошибки при изменении запроса
		if (searchResults.length > 0) {
			setSearchResults([]);
		}
		if (error) {
			setError(null);
		}
	};

	// Функция для выполнения поиска
	const handleSearch = async () => {
		if (!query.trim() || query.length < 3) {
			setError('Для поиска необходимо ввести не менее 3 символов');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const response = await searchUsers(query);
			if (response.success && response.data) {
				setSearchResults(response.data);
				if (response.data.length === 0) {
					setError('По вашему запросу ничего не найдено');
				}
			} else {
				setError(response.error || 'Не удалось выполнить поиск');
			}
		} catch (err) {
			setError('Произошла ошибка при поиске пользователей');
		} finally {
			setIsLoading(false);
		}
	};

	// Обработчик нажатия Enter в поле поиска
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	// Функция для отправки запроса на дружбу
	const handleSendRequest = async (userId: number) => {
		try {
			const response = await sendFriendRequest(userId);
			if (response.success) {
				// Добавляем ID пользователя в список ожидающих
				setPendingRequests([...pendingRequests, userId]);
				// Вызываем callback, если он передан
				if (onSendRequest) {
					onSendRequest();
				}
			}
		} catch (err) {
			console.error('Ошибка при отправке запроса на дружбу:', err);
		}
	};

	return (
		<div className={block()}>
			<div className={element('search-form')}>
				<div className={element('input-container')}>
					<input
						type="text"
						className={element('input')}
						placeholder="Найти пользователей..."
						value={query}
						onChange={handleQueryChange}
						onKeyDown={handleKeyDown}
					/>
					<Svg icon="search" className={element('search-icon')} />
				</div>
				<Button theme="blue" onClick={handleSearch} className={element('search-button')}>
					Найти
				</Button>
			</div>

			{error && <div className={element('error')}>{error}</div>}

			<Loader isLoading={isLoading}>
				{searchResults.length > 0 && (
					<div className={element('results')}>
						<h3 className={element('results-title')}>Результаты поиска</h3>
						<ul className={element('users-list')}>
							{searchResults.map((user) => (
								<li key={user.id} className={element('user-item')}>
									<div className={element('user-info')}>
										<div className={element('user-avatar')}>{user.first_name[0] || user.username[0]}</div>
										<div className={element('user-details')}>
											<div className={element('user-name')}>
												{user.first_name} {user.last_name}
												<span className={element('user-username')}>@{user.username}</span>
											</div>
											<div className={element('user-meta')}>
												{user.friends_count > 0 && (
													<span className={element('friends-count')}>Друзей: {user.friends_count}</span>
												)}
											</div>
										</div>
									</div>
									<Button
										theme="blue-light"
										className={element('action-button')}
										onClick={() => handleSendRequest(user.id)}
										active={pendingRequests.includes(user.id)}
									>
										{pendingRequests.includes(user.id) ? 'Запрос отправлен' : 'Добавить в друзья'}
									</Button>
								</li>
							))}
						</ul>
					</div>
				)}
			</Loader>
		</div>
	);
};
