import {AnimatePresence} from 'framer-motion';
import {observer} from 'mobx-react-lite';
import React from 'react';

import Notification from '@/components/Notification/Notification';
import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';
import './notification-container.scss';

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
