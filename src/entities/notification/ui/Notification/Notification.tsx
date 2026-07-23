import {motion} from 'framer-motion';
import {observer} from 'mobx-react-lite';
import React, {ReactNode} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import {NotificationStore} from '@/shared/model/NotificationStore';
import {Alert, type AlertType} from '@/shared/ui/Alert/Alert';

import '@/entities/notification/ui/Notification/notification.scss';

interface NotificationProps {
	id: string;
	type: 'success' | 'error' | 'warning';
	title: string;
	message?: string | ReactNode | {[key: string]: Array<string>};
	actionText?: string;
	action?: () => void;
}

const mapType = (t: NotificationProps['type']): AlertType => (t === 'error' ? 'danger' : t);

const Notification: React.FC<NotificationProps> = observer(({id, type, title, message, actionText, action}) => {
	const [block] = useBem('notification');

	const alertMessage = typeof message === 'string' || React.isValidElement(message) ? message : undefined;

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
				message={alertMessage}
				actionText={actionText}
				onAction={action}
				onClose={() => NotificationStore.removeNotification(id)}
			/>
		</motion.div>
	);
});

export default Notification;
