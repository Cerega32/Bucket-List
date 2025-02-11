import React from 'react';
import {observer} from 'mobx-react-lite';
import Notification from '@/components/Notification/Notification';
import {AnimatePresence} from 'framer-motion';

import {NotificationStore} from '@/store/NotificationStore';
import {useBem} from '@/hooks/useBem';
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
