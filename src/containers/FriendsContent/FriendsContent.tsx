import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {normalizeCompareResponse} from '@/components/CompareFriendModal/CompareFriendModal';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {FriendCard} from '@/components/FriendCard/FriendCard';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {ModalStore} from '@/store/ModalStore';
import {NotificationStore} from '@/store/NotificationStore';
import {compareWithFriend, getFriends} from '@/utils/api/friends';

import {FriendsContentSkeleton} from './FriendsContentSkeleton';
import './friends-content.scss';

export const FriendsContent: FC = observer(() => {
	const [block, element] = useBem('friends-content');
	const [isComparing, setIsComparing] = useState(false);

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
		try {
			setIsComparing(true);
			const comparison = await compareWithFriend(friendId);
			const normalized = normalizeCompareResponse(comparison);
			ModalStore.setModalProps({comparisonData: normalized});
			ModalStore.setWindow('compare-friend');
			ModalStore.setIsOpen(true);
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось получить данные для сравнения',
			});
		} finally {
			setIsComparing(false);
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
			<Loader isLoading={isComparing}>
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
			</Loader>
		</section>
	);
});
