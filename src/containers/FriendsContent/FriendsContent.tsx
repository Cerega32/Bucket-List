import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';

import {Button} from '@/components/Button/Button';
import {FriendCard} from '@/components/FriendCard/FriendCard';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {compareWithFriend, getFriends} from '@/utils/api/friends';

import './friends-content.scss';

export const FriendsContent: FC = observer(() => {
	const [block, element] = useBem('friends-content');

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
			FriendsStore.setIsLoading(true);
			const comparison = await compareWithFriend(friendId);
			FriendsStore.setComparison(comparison);

			NotificationStore.addNotification({
				type: 'success',
				title: 'Сравнение готово',
				message: 'Данные для сравнения загружены',
			});
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось получить данные для сравнения',
			});
		} finally {
			FriendsStore.setIsLoading(false);
		}
	};

	if (FriendsStore.isLoading) {
		return (
			<section className={block()}>
				<div className={element('loading')}>
					<p>Загрузка...</p>
				</div>
			</section>
		);
	}

	return (
		<section className={block()}>
			<div className={element('header')}>
				<h1 className={element('title')}>Мои друзья ({FriendsStore.friendsCount})</h1>
				<p className={element('subtitle')}>Управляйте списком друзей и сравнивайте достижения</p>
			</div>

			{FriendsStore.isEmptyFriends ? (
				<div className={element('empty-state')}>
					<div className={element('empty-icon')}>👥</div>
					<h3 className={element('empty-title')}>У вас пока нет друзей</h3>
					<p className={element('empty-text')}>Найдите единомышленников среди пользователей Bucket List и добавьте их в друзья</p>
					<Button theme="blue" type="Link" href="/user/self/friends/search">
						Найти друзей
					</Button>
				</div>
			) : (
				<div className={element('friends-list')}>
					{FriendsStore.friends.map((friend) => (
						<FriendCard key={friend.id} friend={friend} onCompare={handleCompareWithFriend} />
					))}
				</div>
			)}
		</section>
	);
});
