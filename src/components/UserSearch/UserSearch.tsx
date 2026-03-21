import {observer} from 'mobx-react-lite';
import React, {useCallback, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {IFriendSearchResult} from '@/typings/user';
import {searchUsers, sendFriendRequest} from '@/utils/api/friends';
import {debounce} from '@/utils/time/debounce';

import {EmptyState} from '../EmptyState/EmptyState';
import {FieldInput} from '../FieldInput/FieldInput';
import {FriendCard} from '../FriendCard/FriendCard';
import {Loader} from '../Loader/Loader';
import './user-search.scss';
import {Title} from '../Title/Title';

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
			const normalizedQuery = searchQuery.trim().toLowerCase();
			if (normalizedQuery.length < 3) {
				FriendsStore.clearSearchResults();
				return;
			}

			try {
				FriendsStore.setIsSearching(true);
				const response = await searchUsers(normalizedQuery);
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
		const friend = {
			id: user.id,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			avatar: user.avatar,
			status: 'pending' as const,
			createdAt: new Date().toISOString(),
		};

		const friendFromStore = FriendsStore.friends.find((f) => f.id === user.id);
		const pendingRequestFromStore = FriendsStore.friendRequests.find((r) => r.id === user.id);

		const isFriend = !!friendFromStore || !!user.isFriend;
		const hasPendingRequest = !!pendingRequestFromStore || !!user.hasPendingRequest;
		const isRequestFromMe = pendingRequestFromStore?.type === 'outgoing' || user.isRequestFromMe;

		const actions = isFriend ? (
			<Button type="Link" href={`/user/${user.id}/showcase`} theme="green" size="small">
				Уже в друзьях
			</Button>
		) : hasPendingRequest ? (
			<Button theme={'secondary' as any} size="small" disabled>
				{isRequestFromMe ? 'Запрос отправлен' : 'Ответить на запрос'}
			</Button>
		) : (
			<Button theme="blue" size="small" onClick={() => handleSendFriendRequest(user.id)} disabled={isProcessing[user.id]}>
				Добавить в друзья
			</Button>
		);

		return (
			<FriendCard
				key={user.id}
				friend={friend}
				showActions={false}
				sinceText={
					friend.firstName || friend.lastName
						? `${friend.firstName || ''} ${friend.lastName || ''}`.trim()
						: 'Пользователь Delting'
				}
				actions={actions}
			/>
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
					<Title className={element('results-title')} tag="h4">
						Найдено пользователей: {FriendsStore.searchResults.length}
					</Title>
					<div className={element('results-list')}>{FriendsStore.searchResults.map(renderUserCard)}</div>
				</div>
			)}

			{query.trim().length >= 2 && !FriendsStore.isSearching && !FriendsStore.hasSearchResults && (
				<EmptyState title="Пользователи не найдены" description="Попробуйте изменить параметры поиска" size="small" />
			)}
		</div>
	);
});
