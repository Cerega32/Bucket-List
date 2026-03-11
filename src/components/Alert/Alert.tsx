import React, {ReactNode} from 'react';

import {useBem} from '@/hooks/useBem';

import {Button} from '../Button/Button';
import {Svg} from '../Svg/Svg';

import './alert.scss';

export type AlertType = 'success' | 'warning' | 'danger';

export interface AlertProps {
	type: AlertType;
	title?: string;
	message?: string | ReactNode;
	actionText?: string;
	onAction?: () => void;
	actionText2?: string;
	onAction2?: () => void;
	onClose?: () => void;
	className?: string;
}

export const Alert: React.FC<AlertProps> = ({type, title, message, actionText, onAction, actionText2, onAction2, onClose, className}) => {
	const [block, element] = useBem('alert', className);

	return (
		<div className={block({type})}>
			{onClose != null && <Button type="button-close" onClick={onClose} className={element('close')} />}
			<Svg icon="info" className={element('icon', {type})} />
			<div className={element('content')}>
				{title != null && <h3 className={element('title')}>{title}</h3>}
				{message != null &&
					(typeof message === 'string' ? (
						<p className={element('message')}>{message}</p>
					) : (
						<div className={element('message')}>{message}</div>
					))}
				{((actionText != null && onAction != null) || (actionText2 != null && onAction2 != null)) && (
					<div className={element('actions')}>
						{actionText != null && onAction != null && (
							<Button className={element('action')} theme="no-border" type="button" width="auto" onClick={onAction}>
								{actionText}
							</Button>
						)}
						{actionText2 != null && onAction2 != null && (
							<Button
								className={element('action', {secondary: true})}
								theme="no-border"
								type="button"
								width="auto"
								onClick={onAction2}
							>
								{actionText2}
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
