import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef} from 'react';

import {compareWithFriend, getFriends} from '@/entities/friend/api/friends';
import {FriendsStore} from '@/entities/friend/model/FriendsStore';
import {FriendCard} from '@/entities/friend/ui/FriendCard/FriendCard';
import {normalizeCompareResponse} from '@/features/compare-friend/CompareFriendModal';
import {useBem} from '@/shared/lib/hooks/useBem';
import {ModalStore} from '@/shared/model/ModalStore';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {Button} from '@/shared/ui/Button/Button';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';
import {FriendsContentSkeleton} from '@/widgets/friends-content/FriendsContentSkeleton';
import '@/widgets/friends-content/friends-content.scss';

export const FriendsContent: FC = observer(() => {
	const [block, element] = useBem('friends-content');
	const compareRequestIdRef = useRef(0);

	// Загрузка друзей при монтировании компонента
	useEffect(() => {
		const loadFriends = async () => {
			try {
				FriendsStore.setIsLoading(true);
				const response = await getFriends();

				// Преобразуем данные в нужный формат
				const formattedFriends = response.results.map((friend) => ({
					id: friend.id,
					username: friend.username,
					firstName: friend.firstName,
					lastName: friend.lastName,
					status: friend.status as 'accepted',
					createdAt: friend.createdAt,
					avatar: friend.avatar,
				}));

				FriendsStore.setFriends(formattedFriends);
			} catch (error) {
				console.error('Ошибка при загрузке списка друзей:', error);
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: error instanceof Error ? error.message : 'Не удалось загрузить список друзей',
				});
			} finally {
				FriendsStore.setIsLoading(false);
			}
		};

		loadFriends();
	}, []);

	const handleCompareWithFriend = async (friendId: number) => {
		const requestId = ++compareRequestIdRef.current;

		ModalStore.setWindow('compare-friend');
		ModalStore.setModalProps({comparisonData: null, isComparing: true});
		ModalStore.setIsOpen(true);

		try {
			const comparison = await compareWithFriend(friendId);
			if (requestId !== compareRequestIdRef.current) return;

			const normalized = normalizeCompareResponse(comparison);
			ModalStore.setModalProps({comparisonData: normalized, isComparing: false});
		} catch (error) {
			if (requestId !== compareRequestIdRef.current) return;

			ModalStore.setIsOpen(false);
			ModalStore.setModalProps({comparisonData: null, isComparing: false});
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось получить данные для сравнения',
			});
		}
	};

	if (FriendsStore.isLoading) {
		return (
			<section className={block()}>
				<FriendsContentSkeleton />
			</section>
		);
	}

	return (
		<section className={block()}>
			{FriendsStore.isEmptyFriends ? (
				<EmptyState
					title="У вас пока нет друзей"
					description="Найдите единомышленников среди пользователей Bucket List и добавьте их в друзья"
				>
					<Button width="auto" theme="blue" type="Link" href="/user/self/friends/search">
						Найти друзей
					</Button>
				</EmptyState>
			) : (
				<div className={element('friends-list')}>
					{FriendsStore.friends.map((friend) => (
						<FriendCard
							className={element('friend-card')}
							key={friend.id}
							friend={friend}
							onCompare={handleCompareWithFriend}
						/>
					))}
				</div>
			)}
		</section>
	);
});
