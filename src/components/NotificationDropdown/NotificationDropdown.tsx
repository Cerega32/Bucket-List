import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {HeaderNotificationsStore} from '@/store/HeaderNotificationsStore';
import {IHeaderNotification} from '@/typings/notification';
import {respondToFriendRequest} from '@/utils/api/friends';

import {Avatar} from '../Avatar/Avatar';
import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';
import {Svg} from '../Svg/Svg';
import './notification-dropdown.scss';

interface NotificationDropdownProps {
	isOpen: boolean;
	onClose: () => void;
}

const getNotificationIcon = (type: string) => {
	switch (type) {
		case 'friend_request':
			return 'user-plus';
		case 'friend_accepted':
			return 'user-check';
		case 'friend_rejected':
			return 'user-x';
		case 'achievement':
			return 'award';
		case 'goal_completed':
		case 'list_completed':
			return 'done';
		case 'goal_approved':
			return 'check';
		case 'goal_rejected':
			return 'cross';
		case 'level_up':
			return 'rocket';
		case 'daily_goal_reminder':
		case 'daily_challenge':
		case 'weekly_challenge':
			return 'zap';
		case 'daily_goal_streak_broken':
			return 'signal';
		default:
			return 'bell';
	}
};

/** Определяет, нужно ли показывать картинку объекта вместо аватара/иконки */
const hasObjectImage = (notification: IHeaderNotification) => {
	return (
		notification.relatedObjectImage &&
		['achievement', 'goal_approved', 'goal_rejected', 'goal_completed', 'list_completed'].includes(notification.type)
	);
};

/** Возвращает ссылку для перехода по клику на уведомление */
const getNotificationLink = (notification: IHeaderNotification): string | null => {
	const {type, relatedObjectType, relatedObjectCode, sender} = notification;

	if (relatedObjectType === 'goal' && relatedObjectCode) {
		return `/goals/${relatedObjectCode}`;
	}

	if (relatedObjectType === 'list' && relatedObjectCode) {
		return `/list/${relatedObjectCode}`;
	}

	if (relatedObjectType === 'user' && relatedObjectCode) {
		return `/user/${relatedObjectCode}/showcase`;
	}

	if (relatedObjectType === 'friendship' && relatedObjectCode) {
		return `/user/${relatedObjectCode}/showcase`;
	}

	if (type === 'friend_request' || type === 'friend_accepted' || type === 'friend_rejected') {
		if (sender?.id) return `/user/${sender.id}/showcase`;
	}

	return null;
};

export const NotificationDropdown: FC<NotificationDropdownProps> = observer(({isOpen, onClose}) => {
	const [block, element] = useBem('notification-dropdown');
	const dropdownRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleNotificationClick = async (notification: IHeaderNotification) => {
		if (!notification.isRead) {
			await HeaderNotificationsStore.markAsRead(notification.id);
		}
		const link = getNotificationLink(notification);
		if (link) {
			onClose();
			navigate(link);
		}
	};

	const handleMarkAllAsRead = async () => {
		await HeaderNotificationsStore.markAllAsRead();
	};

	const handleFriendAction = async (e: React.MouseEvent, notification: IHeaderNotification, action: 'accept' | 'reject') => {
		e.stopPropagation();
		if (!notification.sender?.id) return;

		try {
			await respondToFriendRequest(notification.sender.id, action);
			// respondToFriendRequest сам вызывает refreshNotifications
		} catch {
			// ошибка обработана внутри respondToFriendRequest
		}
	};

	if (!isOpen) return null;

	return (
		<div ref={dropdownRef} className={block()}>
			<div className={element('header')}>
				<h3 className={element('title')}>Уведомления</h3>
				{HeaderNotificationsStore.hasUnreadNotifications && (
					<button type="button" className={element('mark-all')} onClick={handleMarkAllAsRead}>
						Прочитать все
					</button>
				)}
			</div>

			<div className={element('content')}>
				{!HeaderNotificationsStore.notifications || HeaderNotificationsStore.notifications.length === 0 ? (
					<EmptyState
						title="Нет уведомлений"
						description="Все уведомления появятся здесь"
						size="small"
						className={element('empty')}
					/>
				) : (
					<div className={element('list')}>
						{HeaderNotificationsStore.notifications.map((notification) => {
							const userName = notification.sender
								? `${notification.sender.firstName} ${notification.sender.lastName}`.trim() || notification.sender.username
								: notification.userName;
							const userAvatar = notification.sender?.avatar || notification.userAvatar;
							const showObjectImage = hasObjectImage(notification);
							const isFriendRequest = notification.type === 'friend_request' && !notification.isRead;

							return (
								<div
									key={notification.id}
									className={element('item', {unread: !notification.isRead})}
									onClick={() => handleNotificationClick(notification)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											handleNotificationClick(notification);
										}
									}}
									role="button"
									tabIndex={0}
								>
									<div className={element('item-avatar')}>
										{showObjectImage ? (
											<img src={notification.relatedObjectImage} alt="" className={element('item-image')} />
										) : userName ? (
											<Avatar avatar={userAvatar} size="medium" />
										) : (
											<div className={element('item-icon')}>
												<Svg icon={getNotificationIcon(notification.type)} />
											</div>
										)}
									</div>
									<div className={element('item-content')}>
										<div className={element('item-row')}>
											<h4 className={element('item-title')}>{notification.title}</h4>
											{!notification.isRead && <div className={element('item-dot')} />}
										</div>
										<p className={element('item-message')}>{notification.message}</p>
										{isFriendRequest && (
											<div className={element('item-actions')}>
												<Button
													theme="blue"
													size="small"
													onClick={(e) => handleFriendAction(e, notification, 'accept')}
												>
													Принять
												</Button>
												<Button
													theme="gray"
													size="small"
													onClick={(e) => handleFriendAction(e, notification, 'reject')}
												>
													Отклонить
												</Button>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
});
