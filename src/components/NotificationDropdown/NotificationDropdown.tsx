import Cookies from 'js-cookie';
import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import useScreenSize from '@/hooks/useScreenSize';
import {HeaderNotificationsStore} from '@/store/HeaderNotificationsStore';
import {IHeaderNotification} from '@/typings/notification';
import {respondToFriendRequest} from '@/utils/api/friends';

import {NotificationDropdownSkeleton} from './NotificationDropdownSkeleton';
import {Avatar} from '../Avatar/Avatar';
import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';
import {Line} from '../Line/Line';
import {Svg} from '../Svg/Svg';

import './notification-dropdown.scss';

interface NotificationDropdownProps {
	isOpen: boolean;
	onClose: () => void;
	disableClickOutside?: boolean;
	inModal?: boolean;
}

const getNotificationIcon = (type: string) => {
	switch (type) {
		case 'friend_request':
			return 'user';
		case 'friend_accepted':
			return 'regular-checked';
		case 'friend_rejected':
			return 'regular-cancel';
		case 'achievement':
			return 'award';
		case 'goal_completed':
		case 'list_completed':
			return 'done';
		case 'goal_approved':
		case 'list_approved':
			return 'done';
		case 'goal_rejected':
		case 'list_rejected':
			return 'cross';
		case 'level_up':
			return 'rocket';
		case 'daily_goal_reminder':
		case 'daily_challenge':
		case 'weekly_challenge':
			return 'signal';
		case 'weekly_leaderboard':
			return 'chart';
		case 'subscription_expiring_5d':
		case 'subscription_expiring_1d':
		case 'subscription_expired':
			return 'award';
		case 'daily_goal_streak_broken':
			return 'signal';
		case 'comment_complaint':
		case 'comment_complaint_staff':
		case 'comment_removed':
			return 'exclamation-triangle';
		case 'comment_restored':
			return 'done';
		case 'goal_merged':
			return 'refresh';
		case 'merge_request_approved':
			return 'done';
		case 'merge_request_rejected':
			return 'cross';
		default:
			return 'bell';
	}
};

/** Цвет иконки: галочка — зелёная, крестик — красный */
const getNotificationIconTheme = (type: string): 'green' | 'red' | 'blue' | undefined => {
	switch (type) {
		case 'merge_request_approved':
		case 'goal_approved':
		case 'list_approved':
		case 'friend_accepted':
		case 'comment_restored':
		case 'goal_completed':
		case 'list_completed':
			return 'green';
		case 'merge_request_rejected':
		case 'goal_rejected':
		case 'list_rejected':
		case 'friend_rejected':
		case 'comment_complaint':
		case 'comment_complaint_staff':
		case 'comment_removed':
			return 'red';
		case 'weekly_leaderboard':
			return 'blue';
		default:
			return undefined;
	}
};

const isCommentModerationNotification = (type: string) =>
	type === 'comment_complaint' || type === 'comment_complaint_staff' || type === 'comment_removed' || type === 'comment_restored';

/** Определяет, нужно ли показывать картинку объекта вместо аватара/иконки */
const hasObjectImage = (notification: IHeaderNotification) => {
	return (
		notification.relatedObjectImage &&
		['achievement', 'goal_approved', 'goal_rejected', 'list_approved', 'list_rejected', 'goal_completed', 'list_completed'].includes(
			notification.type
		)
	);
};

const isAchievementImage = (notification: IHeaderNotification) => {
	return notification.type === 'achievement' && notification.relatedObjectImage;
};

/** Возвращает ссылку для перехода по клику на уведомление */
const getNotificationLink = (notification: IHeaderNotification): string | null => {
	const {type, relatedObjectType, relatedObjectCode, sender} = notification;

	if (type === 'achievement') {
		const userId = Cookies.get('user-id');
		return userId ? `/user/${userId}/achievements` : '/user/self/achievements';
	}

	if (type === 'weekly_leaderboard') {
		return '/leaders?period=previous';
	}

	if (type === 'level_up') {
		return '/user/self';
	}

	if (type === 'goal_approved' || type === 'goal_rejected' || type === 'list_approved' || type === 'list_rejected') {
		return '/user/self/pending-review';
	}

	if (type === 'merge_request_rejected') {
		return '/user/self/pending-review/merges';
	}

	if (type === 'comment_complaint' || type === 'comment_complaint_staff' || type === 'comment_restored' || type === 'comment_removed') {
		if (relatedObjectCode) {
			return `/goals/${relatedObjectCode}`;
		}
		const userId = Cookies.get('user-id');
		return userId ? `/user/${userId}/showcase` : '/user/self';
	}

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

	if (relatedObjectType === 'subscription') {
		return '/user/self/subs';
	}

	if (type === 'subscription_expiring_5d' || type === 'subscription_expiring_1d' || type === 'subscription_expired') {
		return '/user/self/subs';
	}

	if (type === 'friend_request' || type === 'friend_accepted' || type === 'friend_rejected') {
		if (sender?.id) return `/user/${sender.id}/showcase`;
	}

	return null;
};

export const NotificationDropdown: FC<NotificationDropdownProps> = observer(({isOpen, onClose, disableClickOutside, inModal}) => {
	const [block, element] = useBem('notification-dropdown');
	const dropdownRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const {isScreenSmallMobile} = useScreenSize();
	const [imagesReady, setImagesReady] = useState(false);

	const {notifications} = HeaderNotificationsStore;
	const urls = Array.from(
		new Set(
			(notifications || [])
				.flatMap((n) => [n.relatedObjectImage, n.sender?.avatar, n.userAvatar])
				.filter((url): url is string => typeof url === 'string' && url.length > 0)
		)
	);
	const urlsKey = urls.join('|');

	useEffect(() => {
		if (urls.length === 0) {
			setImagesReady(true);
			return undefined;
		}
		setImagesReady(false);
		let cancelled = false;
		let pending = urls.length;
		const done = () => {
			pending -= 1;
			if (pending <= 0 && !cancelled) setImagesReady(true);
		};
		urls.forEach((url) => {
			const img = new Image();
			img.onload = done;
			img.onerror = done;
			img.src = url;
		});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [urlsKey]);

	useEffect(() => {
		if (disableClickOutside) return;

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
	}, [isOpen, onClose, disableClickOutside]);

	const handleNotificationClick = async (notification: IHeaderNotification) => {
		const link = getNotificationLink(notification);
		if (link) {
			onClose();
			navigate(link);
		}
		if (!notification.isRead) {
			await HeaderNotificationsStore.markAsRead(notification.id);
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
		<div ref={dropdownRef} className={block({'in-modal': inModal})}>
			<div className={element('header')}>
				<h3 className={element('title')}>{!isScreenSmallMobile ? 'Уведомления' : ''}</h3>
				{HeaderNotificationsStore.hasUnreadNotifications && (
					<button type="button" className={element('mark-all')} onClick={handleMarkAllAsRead}>
						Прочитать все
					</button>
				)}
			</div>
			<Line margin="8px 0" />

			<div className={element('content')}>
				{HeaderNotificationsStore.isLoading || !imagesReady ? (
					<NotificationDropdownSkeleton />
				) : !HeaderNotificationsStore.notifications || HeaderNotificationsStore.notifications.length === 0 ? (
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
							const showModerationIcon = isCommentModerationNotification(notification.type);
							const iconTheme = getNotificationIconTheme(notification.type);
							// Для approve/reject и модерации всегда иконка (не аватар отправителя)
							const showStatusIcon =
								showModerationIcon ||
								notification.type === 'merge_request_approved' ||
								notification.type === 'merge_request_rejected' ||
								notification.type === 'goal_approved' ||
								notification.type === 'goal_rejected' ||
								notification.type === 'list_approved' ||
								notification.type === 'list_rejected' ||
								!userName;

							return (
								<div key={notification.id}>
									<div
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
											{isAchievementImage(notification) ? (
												<div className={element('item-icon')}>
													<img
														src={notification.relatedObjectImage}
														alt=""
														className={element('item-image', {small: true})}
													/>
												</div>
											) : showObjectImage ? (
												<img src={notification.relatedObjectImage} alt="" className={element('item-image')} />
											) : showStatusIcon ? (
												<div
													className={element('item-icon', {
														green: iconTheme === 'green',
														red: iconTheme === 'red',
														blue: iconTheme === 'blue',
													})}
												>
													<Svg width="24px" height="24px" icon={getNotificationIcon(notification.type)} />
												</div>
											) : (
												<Avatar avatar={userAvatar} size="medium" noBorder />
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
									<Line margin="8px 0" className={element('item-line')} />
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
});
