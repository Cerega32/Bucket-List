import React, {ReactNode} from 'react';

import {useBem} from '@/hooks/useBem';

import {Button} from '../Button/Button';
import {Svg} from '../Svg/Svg';

import './alert.scss';

export type AlertType = 'success' | 'info' | 'warning' | 'danger';

export interface AlertProps {
	type: AlertType;
	title?: string;
	message?: string | ReactNode;
	actionText?: string;
	onAction?: () => void;
	onClose?: () => void;
	className?: string;
}

export const Alert: React.FC<AlertProps> = ({type, title, message, actionText, onAction, onClose, className}) => {
	const [block, element] = useBem('alert', className);

	return (
		<div className={block({type})}>
			<Svg icon="info" className={element('icon', {type})} />
			<div className={element('content')}>
				{title != null && <h3 className={element('title')}>{title}</h3>}
				{message != null && (typeof message === 'string' ? <p className={element('message')}>{message}</p> : message)}
			</div>
			{actionText != null && onAction != null && (
				<Button className={element('action')} theme="no-border" type="button" width="auto" onClick={onAction}>
					{actionText}
				</Button>
			)}
			{onClose != null && <Button type="button-close" onClick={onClose} className={element('close')} />}
		</div>
	);
};
