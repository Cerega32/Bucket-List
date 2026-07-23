import {AnimatePresence} from 'framer-motion';
import {observer} from 'mobx-react-lite';
import React from 'react';

import Notification from '@/entities/notification/ui/Notification/Notification';
import {useBem} from '@/shared/lib/hooks/useBem';
import {NotificationStore} from '@/shared/model/NotificationStore';
import '@/app/providers/Notifications/notification-container.scss';

const NotificationContainer: React.FC = observer(() => {
	const [block] = useBem('notification-container');

	return (
		<div className={block()}>
			<AnimatePresence>
				{NotificationStore.visibleNotifications.map((notif) => (
					<Notification key={notif.id} {...notif} />
				))}
			</AnimatePresence>
		</div>
	);
});

export default NotificationContainer;
