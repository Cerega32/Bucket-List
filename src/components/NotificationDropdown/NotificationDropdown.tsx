import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef} from 'react';

import {useBem} from '@/hooks/useBem';
import {HeaderNotificationsStore} from '@/store/HeaderNotificationsStore';
import {formatNotificationTime} from '@/utils/date/formatNotificationTime';

import {Avatar} from '../Avatar/Avatar';
import {Button} from '../Button/Button';
import './notification-dropdown.scss';

interface NotificationDropdownProps {
	isOpen: boolean;
	onClose: () => void;
}

export const NotificationDropdown: FC<NotificationDropdownProps> = observer(({isOpen, onClose}) => {
	const [block, element] = useBem('notification-dropdown');
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Закрываем при клике вне компонента
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

	const handleNotificationClick = async (notificationId: number) => {
		try {
			await HeaderNotificationsStore.markAsRead(notificationId);
		} catch (error) {
			console.error('Ошибка отметки уведомления:', error);
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			await HeaderNotificationsStore.markAllAsRead();
		} catch (error) {
			console.error('Ошибка отметки всех уведомлений:', error);
		}
	};

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case 'friend_request':
				return 'user-plus';
			case 'friend_accepted':
				return 'user-check';
			case 'friend_rejected':
				return 'user-x';
			case 'achievement':
				return 'trophy';
			case 'goal_completed':
				return 'check-circle';
			default:
				return 'bell';
		}
	};

	if (!isOpen) return null;

	return (
		<div ref={dropdownRef} className={block()}>
			<div className={element('header')}>
				<h3 className={element('title')}>Уведомления</h3>
				{HeaderNotificationsStore.hasUnreadNotifications && (
					<Button theme="blue-light" size="small" onClick={handleMarkAllAsRead}>
						Отметить все
					</Button>
				)}
			</div>

			<div className={element('content')}>
				{HeaderNotificationsStore.notifications.length === 0 ? (
					<div className={element('empty')}>
						<p>Нет уведомлений</p>
					</div>
				) : (
					<div className={element('list')}>
						{HeaderNotificationsStore.notifications.map((notification) => {
							const userName = notification.sender
								? `${notification.sender.firstName} ${notification.sender.lastName}`.trim() || notification.sender.username
								: notification.userName;
							const userAvatar = notification.sender?.avatar || notification.userAvatar;

							return (
								<button
									key={notification.id}
									className={element('item', {unread: !notification.isRead})}
									onClick={() => handleNotificationClick(notification.id)}
									type="button"
									aria-label={`Отметить уведомление "${notification.title}" как прочитанное`}
								>
									<div className={element('item-avatar')}>
										{userName ? (
											<Avatar avatar={userAvatar} size="small" />
										) : (
											<div className={element('item-icon')}>
												<span className={`icon-${getNotificationIcon(notification.type)}`} />
											</div>
										)}
									</div>
									<div className={element('item-content')}>
										<div className={element('item-header')}>
											<h4 className={element('item-title')}>{notification.title}</h4>
											<span className={element('item-time')}>
												{formatNotificationTime(new Date(notification.createdAt))}
											</span>
										</div>
										<p className={element('item-message')}>{notification.message}</p>
									</div>
									{!notification.isRead && <div className={element('item-badge')} />}
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
});
