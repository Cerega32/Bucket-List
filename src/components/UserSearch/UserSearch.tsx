import {observer} from 'mobx-react-lite';
import React, {useCallback, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {IFriendSearchResult} from '@/typings/user';
import {searchUsers, sendFriendRequest} from '@/utils/api/friends';
import {debounce} from '@/utils/time/debounce';

import {FieldInput} from '../FieldInput/FieldInput';
import {Loader} from '../Loader/Loader';
import './user-search.scss';

interface UserSearchProps {
	placeholder?: string;
}

export const UserSearch: React.FC<UserSearchProps> = observer(({placeholder = 'Поиск пользователей...'}) => {
	const [block, element] = useBem('user-search');
	const [query, setQuery] = useState('');
	const [isProcessing, setIsProcessing] = useState<{[key: number]: boolean}>({});

	// Debounced search function
	const debouncedSearch = useCallback(
		debounce(async (searchQuery: string) => {
			if (searchQuery.trim().length < 3) {
				FriendsStore.clearSearchResults();
				return;
			}

			try {
				FriendsStore.setIsSearching(true);
				const response = await searchUsers(searchQuery);
				FriendsStore.setSearchResults(response.results);
			} catch (error) {
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка поиска',
					message: error instanceof Error ? error.message : 'Не удалось выполнить поиск',
				});
			} finally {
				FriendsStore.setIsSearching(false);
			}
		}, 300),
		[]
	);

	const handleInputChange = (value: string) => {
		setQuery(value);
		debouncedSearch(value);
	};

	const handleSendFriendRequest = async (userId: number) => {
		try {
			setIsProcessing((prev) => ({...prev, [userId]: true}));
			await sendFriendRequest(userId);

			// Обновляем статус в результатах поиска
			FriendsStore.updateSearchResultStatus(userId, {
				hasPendingRequest: true,
				isRequestFromMe: true,
			});
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось отправить запрос',
			});
		} finally {
			setIsProcessing((prev) => ({...prev, [userId]: false}));
		}
	};

	const renderUserCard = (user: IFriendSearchResult) => {
		const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username;

		const isButtonDisabled = isProcessing[user.id] || user.isFriend || user.hasPendingRequest;

		let buttonText = 'Добавить в друзья';
		let buttonTheme = 'blue-light';

		if (user.isFriend) {
			buttonText = 'Уже друзья';
			buttonTheme = 'secondary';
		} else if (user.hasPendingRequest) {
			buttonText = user.isRequestFromMe ? 'Запрос отправлен' : 'Ответить на запрос';
			buttonTheme = 'secondary';
		}

		return (
			<div key={user.id} className={element('result-card')}>
				<div className={element('result-avatar')}>
					{user.avatar ? (
						<img src={user.avatar} alt={displayName} />
					) : (
						<div className={element('result-avatar-placeholder')}>{displayName.charAt(0).toUpperCase()}</div>
					)}
				</div>

				<div className={element('result-info')}>
					<h4 className={element('result-name')}>{displayName}</h4>
					<p className={element('result-username')}>@{user.username}</p>
					<p className={element('result-email')}>{user.email}</p>
				</div>

				<div className={element('result-actions')}>
					<Button theme="blue-light" size="small" type="Link" href={`/user/${user.id}/showcase`}>
						Профиль
					</Button>

					<Button
						theme={buttonTheme as any}
						size="small"
						onClick={() => handleSendFriendRequest(user.id)}
						disabled={isButtonDisabled}
					>
						{buttonText}
					</Button>
				</div>
			</div>
		);
	};

	return (
		<div className={block()}>
			<div className={element('input-container')}>
				<FieldInput value={query} setValue={handleInputChange} placeholder={placeholder} id="user-search-input" />
			</div>
			<Loader isLoading={FriendsStore.isSearching} />
			{FriendsStore.hasSearchResults && (
				<div className={element('results')}>
					<h3 className={element('results-title')}>Найдено пользователей: {FriendsStore.searchResults.length}</h3>
					<div className={element('results-list')}>{FriendsStore.searchResults.map(renderUserCard)}</div>
				</div>
			)}

			{query.trim().length >= 2 && !FriendsStore.isSearching && !FriendsStore.hasSearchResults && (
				<div className={element('no-results')}>
					<p>Пользователи не найдены</p>
				</div>
			)}
		</div>
	);
});
