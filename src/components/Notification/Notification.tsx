import {FC, useState, useEffect} from 'react';

import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';
import './notification.scss';

interface NotificationProps {
	className?: string;
	text: string;
}

export const Notification: FC<NotificationProps> = (props) => {
	const {className, text} = props;
	const [isVisible, setIsVisible] = useState(false);

	const [block, element] = useBem('notification', className);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;

		// После полсекундной задержки устанавливаем isVisible в true
		const timeout = setTimeout(() => {
			setIsVisible(true);
		}, 500);

		// Очищаем таймер при размонтировании компонента
		return () => {
			clearTimeout(timeout);
			clearTimeout(timeoutId);
		};
	}, []);

	const characters = text.split('');

	return (
		<div className={block({visible: isVisible})}>
			<span className={element('icon')}>i</span>
			{isVisible && (
				<>
					<div className={element('text')}>
						{characters.map((char, index) => (
							<span key={index} style={{animationDelay: `${index * 0.01}s`}} className={element('char')}>
								{char}
							</span>
						))}
					</div>
					<button
						className={element('close')}
						type="button"
						onClick={() => {}}
						aria-label="Закрыть"
						style={{animationDelay: `${characters.length * 0.01}s`}}
					>
						<Svg icon="cross" />
					</button>
				</>
			)}
		</div>
	);
};
