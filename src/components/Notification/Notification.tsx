import {FC, useEffect, useState} from 'react';

import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';

import './notification.scss';

interface NotificationProps {
	className?: string;
	text: string;
	isError?: boolean;
	onClose: () => void;
}

export const Notification: FC<NotificationProps> = ({className, text, isError, onClose}) => {
	const [isVisible, setIsVisible] = useState(false);
	const [block, element] = useBem('notification', className);

	useEffect(() => {
		const showTimeout = setTimeout(() => setIsVisible(true), 500);
		const hideTimeout = setTimeout(onClose, 5000);

		return () => {
			clearTimeout(showTimeout);
			clearTimeout(hideTimeout);
		};
	}, [onClose]);

	return (
		<div className={block({visible: isVisible})}>
			<span className={element('icon', {error: isError})}>i</span>
			{isVisible && (
				<>
					<div className={element('text')}>
						{text.split('').map((char, index) => (
							<span key={index} style={{animationDelay: `${index * 0.05}s`}} className={element('char')}>
								{char}
							</span>
						))}
					</div>
					<button
						className={element('close')}
						type="button"
						onClick={onClose}
						aria-label="Закрыть"
						style={{animationDelay: `${text.length * 0.05}s`}}
					>
						<Svg icon="cross" />
					</button>
				</>
			)}
		</div>
	);
};
