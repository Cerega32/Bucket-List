import {observer} from 'mobx-react-lite';
import {FC, useEffect} from 'react';

import {FriendRequestCard} from '@/components/FriendRequestCard/FriendRequestCard';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {getFriendRequests} from '@/utils/api/friends';

import './friends-requests.scss';

export const FriendsRequests: FC = observer(() => {
	const [block, element] = useBem('friends-requests');

	// Загрузка заявок при монтировании компонента
	useEffect(() => {
		const loadFriendRequests = async () => {
			try {
				FriendsStore.setIsLoading(true);
				const response = await getFriendRequests();
				FriendsStore.setFriendRequests(response.results);
			} catch (error) {
				console.error('Ошибка при загрузке заявок в друзья:', error);
				NotificationStore.addNotification({
					type: 'error',
					title: 'Ошибка',
					message: error instanceof Error ? error.message : 'Не удалось загрузить заявки в друзья',
				});
			} finally {
				FriendsStore.setIsLoading(false);
			}
		};

		loadFriendRequests();
	}, []);

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
				<h1 className={element('title')}>Заявки в друзья ({FriendsStore.pendingRequestsCount})</h1>
				<p className={element('subtitle')}>Принимайте или отклоняйте входящие заявки в друзья</p>
			</div>

			{FriendsStore.isEmptyRequests ? (
				<div className={element('empty-state')}>
					<div className={element('empty-icon')}>📮</div>
					<h3 className={element('empty-title')}>Нет новых заявок</h3>
					<p className={element('empty-text')}>Когда другие пользователи отправят вам заявки в друзья, они появятся здесь</p>
				</div>
			) : (
				<div className={element('requests-list')}>
					{FriendsStore.friendRequests.map((request) => (
						<FriendRequestCard key={request.requestId} request={request} />
					))}
				</div>
			)}
		</section>
	);
});
