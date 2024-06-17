import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';

import './notifications.scss';
import {NotificationStore} from '@/store/NotificationStore';

import {Notification} from '../Notification/Notification';

export const Notifications: FC = observer(() => {
	const notifications = NotificationStore.notifications.slice(0, 3);

	const [block, element] = useBem('notifications');

	return (
		<div className={block()}>
			{notifications.map((notification, index) => (
				<Notification
					key={index}
					text={notification.text}
					isError={notification.isError}
					onClose={() => NotificationStore.removeNotification(index)}
					className={element('item')}
				/>
			))}
		</div>
	);
});
