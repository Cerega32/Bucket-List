import {motion} from 'framer-motion';
import {observer} from 'mobx-react-lite';
import React from 'react';

import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';

import {Alert, type AlertType} from '../Alert/Alert';

import './notification.scss';

interface NotificationProps {
	id: string;
	type: 'success' | 'error' | 'warning';
	title: string;
	message?: string | {[key: string]: Array<string>};
	actionText?: string;
	action?: () => void;
}

const mapType = (t: NotificationProps['type']): AlertType => (t === 'error' ? 'danger' : t);

const Notification: React.FC<NotificationProps> = observer(({id, type, title, message, actionText, action}) => {
	const [block] = useBem('notification');

	return (
		<motion.div
			className={block()}
			initial={{opacity: 0, y: -20, scale: 0.95}}
			animate={{opacity: 1, y: 0, scale: 1}}
			exit={{opacity: 0, y: -10, scale: 0.9}}
			transition={{duration: 0.3}}
		>
			<Alert
				type={mapType(type)}
				title={title}
				message={typeof message === 'string' ? message : undefined}
				actionText={actionText}
				onAction={action}
				onClose={() => NotificationStore.removeNotification(id)}
			/>
		</motion.div>
	);
});

export default Notification;
