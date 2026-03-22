import {observer} from 'mobx-react-lite';
import React, {useState} from 'react';
import {Link} from 'react-router-dom';

import {Button} from '@/components/Button/Button';
import {useBem} from '@/hooks/useBem';
import {FriendsStore} from '@/store/FriendsStore';
import {NotificationStore} from '@/store/NotificationStore';
import {IFriend} from '@/typings/user';
import {removeFriend} from '@/utils/api/friends';

import {Avatar} from '../Avatar/Avatar';
import {Loader} from '../Loader/Loader';
import './friend-card.scss';

export type FriendCardVariant = 'friend' | 'request' | 'search';

interface FriendCardProps {
	friend: IFriend;
	/** friend — список друзей; request — заявки; search — поиск */
	variant?: FriendCardVariant;
	onRemove?: (friendId: number) => void;
	onCompare?: (friendId: number) => void;
	showActions?: boolean;
	actions?: React.ReactNode;
	sinceText?: string;
	outgoing?: boolean;
	className?: string;
}

const NO_NAME_PLACEHOLDER = 'Пользователь Delting';

const getFullName = (friend: IFriend) => `${friend.firstName || ''} ${friend.lastName || ''}`.trim();

export const FriendCard: React.FC<FriendCardProps> = observer(
	({friend, variant = 'friend', onRemove, onCompare, showActions = true, actions, sinceText, outgoing, className}) => {
		const [block, element] = useBem('friends-card', className);
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

		const fullName = getFullName(friend);
		const hasName = Boolean(fullName);
		const isFriendList = variant === 'friend';
		const showSince = isFriendList;
		const displayName = hasName ? fullName : isFriendList ? friend.username : NO_NAME_PLACEHOLDER;

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
			<Loader isLoading={isRemoving} className={block({outgoing})}>
				<div className={element('avatar')}>
					{friend.avatar ? (
						<Avatar size="medium-56" avatar={friend.avatar} />
					) : (
						<div className={element('avatar-placeholder')}>{friend.username.charAt(0).toUpperCase()}</div>
					)}
				</div>

				<div className={element('info')}>
					<Link className={element('name')} to={`/user/${friend.id}/showcase`} aria-label={`Перейти в профиль ${displayName}`}>
						{friend.username}
					</Link>
					{isFriendList ? (
						hasName && <p className={element('username')}>{fullName}</p>
					) : (
						<p className={element('username')}>{hasName ? fullName : NO_NAME_PLACEHOLDER}</p>
					)}
					{showSince && <p className={element('since')}>{sinceText ?? `Друзья с ${formatFriendshipDate(friend.createdAt)}`}</p>}
				</div>

				{(showActions || actions) && (
					<div className={element('actions')}>
						{actions ?? (
							<>
								<Button theme="blue-light" size="small" onClick={handleCompare}>
									Сравнить
								</Button>

								<Button theme="red" size="small" onClick={handleRemoveFriend}>
									Удалить
								</Button>
							</>
						)}
					</div>
				)}
			</Loader>
		);
	}
);
