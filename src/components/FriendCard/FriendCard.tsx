import {observer} from 'mobx-react-lite';
import React, {useState} from 'react';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {IFriend} from '@/typings/user';
import {removeFriend} from '@/utils/api/friends';

import {Avatar} from '../Avatar/Avatar';
import {Loader} from '../Loader/Loader';
import './friend-card.scss';

interface FriendCardProps {
	friend: IFriend;
	onRemove?: (friendId: number) => void;
	onCompare?: (friendId: number) => void;
	showActions?: boolean;
}

export const FriendCard: React.FC<FriendCardProps> = observer(({friend, onRemove, onCompare, showActions = true}) => {
	const [block, element] = useBem('friend-card');
	const [isRemoving, setIsRemoving] = useState(false);

	const handleRemoveFriend = async () => {
		try {
			setIsRemoving(true);
			await removeFriend(friend.id);
			FriendsStore.removeFriend(friend.id);
			onRemove?.(friend.id);
		} catch (error) {
			NotificationStore.addNotification({
				type: 'error',
				title: 'Ошибка',
				message: error instanceof Error ? error.message : 'Не удалось удалить друга',
			});
		} finally {
			setIsRemoving(false);
		}
	};

	const handleCompare = () => {
		onCompare?.(friend.id);
	};

	const hasName = friend.firstName || friend.lastName;
	const displayName = hasName ? `${friend.firstName || ''} ${friend.lastName || ''}`.trim() : friend.username;

	// Форматируем дату более надежно
	const formatFriendshipDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			// Проверяем что дата валидная
			if (Number.isNaN(date.getTime())) {
				return 'Недавно';
			}
			return date.toLocaleDateString('ru-RU');
		} catch {
			return 'Недавно';
		}
	};

	return (
		<Loader isLoading={isRemoving} className={block()}>
			<div className={element('avatar')}>
				{friend.avatar ? (
					<Avatar size="medium-56" avatar={friend.avatar} />
				) : (
					<div className={element('avatar-placeholder')}>{displayName.charAt(0).toUpperCase()}</div>
				)}
			</div>

			<div className={element('info')}>
				<h3 className={element('name')}>{displayName}</h3>
				{hasName && <p className={element('username')}>{friend.username}</p>}
				<p className={element('since')}>Друзья с {formatFriendshipDate(friend.createdAt)}</p>
			</div>

			{showActions && (
				<div className={element('actions')}>
					<Button type="Link" theme="blue-light" size="small" href={`/user/${friend.id}/showcase`}>
						Профиль
					</Button>

					<Button theme="blue-light" size="small" onClick={handleCompare}>
						Сравнить
					</Button>

					<Button theme="red" size="small" onClick={handleRemoveFriend}>
						Удалить
					</Button>
				</div>
			)}
		</Loader>
	);
});
