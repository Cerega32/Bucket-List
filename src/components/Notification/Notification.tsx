import {motion} from 'framer-motion';
import {observer} from 'mobx-react-lite';
import React from 'react';

import {useBem} from '@/hooks/useBem';
import {NotificationStore} from '@/store/NotificationStore';

import {Button} from '../Button/Button';
import {Svg} from '../Svg/Svg';
import './notification.scss';

interface NotificationProps {
	id: string;
	type: 'success' | 'error' | 'warning';
	title: string;
	message?: string | {[key: string]: Array<string>};
	actionText?: string;
	action?: () => void;
}

const Notification: React.FC<NotificationProps> = observer(({id, type, title, message, actionText, action}) => {
	const [block, element] = useBem('notification');

	return (
		<motion.div
			className={block({type})}
			initial={{opacity: 0, y: -20, scale: 0.95}}
			animate={{opacity: 1, y: 0, scale: 1}}
			exit={{opacity: 0, y: -10, scale: 0.9}}
			transition={{duration: 0.3}}
		>
			<Svg icon="info" className={element('info', {type})} />
			<div className={element('content')}>
				<h3 className={element('title')}>{title}</h3>
				{typeof message === 'string' && <p>{message}</p>}
				{actionText && (
					<Button className={element('btn')} onClick={action} theme="no-border">
						{actionText}
					</Button>
				)}
			</div>
			<Button type="button-close" onClick={() => NotificationStore.removeNotification(id)} />
		</motion.div>
	);
});

export default Notification;
