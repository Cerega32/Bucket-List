import {observer} from 'mobx-react-lite';
import React, {useState} from 'react';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {IFriendRequest} from '@/typings/user';
import {respondToFriendRequest} from '@/utils/api/friends';

import {Avatar} from '../Avatar/Avatar';
import './friend-request-card.scss';

interface FriendRequestCardProps {
	request: IFriendRequest;
	onAccept?: (requestId: number) => void;
	onReject?: (requestId: number) => void;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = observer(({request, onAccept, onReject}) => {
	const [block, element] = useBem('friend-request-card');
	const [isProcessing, setIsProcessing] = useState(false);

	const handleAccept = async () => {
		if (isProcessing) return; // Предотвращаем множественные клики

		try {
			setIsProcessing(true);
			await respondToFriendRequest(request.requestId, 'accept');

			// Обновляем локальное состояние
			FriendsStore.removeFriendRequest(request.requestId);
			// Добавляем в друзья
			FriendsStore.addFriend({
				id: request.id,
				username: request.username,
				firstName: request.firstName,
				lastName: request.lastName,
				avatar: request.avatar,
				status: 'accepted',
				createdAt: new Date().toISOString(),
			});
			onAccept?.(request.requestId);
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
		if (isProcessing) return; // Предотвращаем множественные клики

		try {
			setIsProcessing(true);
			await respondToFriendRequest(request.requestId, 'reject');

			// Обновляем локальное состояние
			FriendsStore.removeFriendRequest(request.requestId);
			onReject?.(request.requestId);
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

	const displayName = request.firstName && request.lastName ? `${request.firstName} ${request.lastName}` : request.username;
	const isIncoming = request.type === 'incoming';

	return (
		<div className={block({outgoing: !isIncoming})}>
			<div className={element('avatar')}>
				<Avatar size="medium-56" avatar={request.avatar} />
			</div>

			<div className={element('info')}>
				<h3 className={element('name')}>{displayName}</h3>
				<p className={element('username')}>@{request.username}</p>
				<p className={element('date')}>{new Date(request.createdAt).toLocaleDateString('ru-RU')}</p>
				{!isIncoming && <p className={element('status')}>Заявка отправлена</p>}
			</div>

			<div className={element('actions')}>
				<Button theme="blue-light" type="Link" href={`/user/${request.id}/showcase`} size="small">
					Профиль
				</Button>

				{isIncoming ? (
					<>
						<Button theme="green" size="small" onClick={handleAccept} active={isProcessing}>
							Принять
						</Button>

						<Button theme="red" size="small" onClick={handleReject} active={isProcessing}>
							Отклонить
						</Button>
					</>
				) : (
					<Button theme="blue-light" size="small" active>
						Ожидает ответа
					</Button>
				)}
			</div>
		</div>
	);
});
