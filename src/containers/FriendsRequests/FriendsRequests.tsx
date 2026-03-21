import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Button} from '@/components/Button/Button';
import {EmptyState} from '@/components/EmptyState/EmptyState';
import {FriendCard} from '@/components/FriendCard/FriendCard';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {IFriendRequest} from '@/typings/user';
import {respondToFriendRequest, getFriendRequests} from '@/utils/api/friends';

import '../FriendsContent/friends-content.scss';

type FriendCardActionsIncomingProps = {request: IFriendRequest};

const FriendCardActionsIncoming: FC<FriendCardActionsIncomingProps> = ({request}) => {
	const [isProcessing, setIsProcessing] = useState(false);

	const handleAccept = async () => {
		if (isProcessing) return;
		try {
			setIsProcessing(true);
			await respondToFriendRequest(request.requestId, 'accept');
			FriendsStore.removeFriendRequest(request.requestId);
			FriendsStore.addFriend({
				id: request.id,
				username: request.username,
				firstName: request.firstName,
				lastName: request.lastName,
				avatar: request.avatar,
				status: 'accepted',
				createdAt: new Date().toISOString(),
			});
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось принять запрос',
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const handleReject = async () => {
		if (isProcessing) return;
		try {
			setIsProcessing(true);
			await respondToFriendRequest(request.requestId, 'reject');
			FriendsStore.removeFriendRequest(request.requestId);
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось отклонить запрос',
			});
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<>
			<Button theme="green" size="small" onClick={handleAccept} disabled={isProcessing}>
				Принять
			</Button>
			<Button theme="red" size="small" onClick={handleReject} disabled={isProcessing}>
				Отклонить
			</Button>
		</>
	);
};

const FriendCardActionsOutgoing = () => (
	<Button theme="blue-light" size="small" disabled>
		Ожидает ответа
	</Button>
);

export const FriendsRequests: FC = observer(() => {
	const [block, element] = useBem('friends-content');

	// Загрузка заявок при монтировании компонента
	useEffect(() => {
		const loadFriendRequests = async () => {
			try {
				FriendsStore.setIsLoading(true);
				const response = await getFriendRequests();
				FriendsStore.setFriendRequests(response.results);
			} catch (error) {
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
			{FriendsStore.isEmptyRequests ? (
				<EmptyState
					title="Нет новых заявок"
					description="Когда другие пользователи отправят вам заявки в друзья, они появятся здесь"
				/>
			) : (
				<div className={element('friends-list')}>
					{FriendsStore.friendRequests.map((request) => {
						const isIncoming = request.type === 'incoming';

						const friend = {
							id: request.id,
							username: request.username,
							firstName: request.firstName,
							lastName: request.lastName,
							status: 'pending' as const,
							avatar: request.avatar,
							createdAt: request.createdAt,
						};

						return (
							<FriendCard
								key={request.requestId}
								className={element('friend-card')}
								friend={friend}
								showActions={false}
								outgoing={!isIncoming}
								actions={isIncoming ? <FriendCardActionsIncoming request={request} /> : <FriendCardActionsOutgoing />}
							/>
						);
					})}
				</div>
			)}
		</section>
	);
});
