import React, {ReactNode} from 'react';

import {useBem} from '@/hooks/useBem';

import {Button} from '../Button/Button';
import {Svg} from '../Svg/Svg';

import './banner.scss';

export type BannerType = 'success' | 'info' | 'warning' | 'danger';

export interface BannerProps {
	type: BannerType;
	title?: string;
	message?: string | ReactNode;
	actionText?: string;
	onAction?: () => void;
	className?: string;
}

export const Banner: React.FC<BannerProps> = ({type, title, message, actionText, onAction, className}) => {
	const [block, element] = useBem('banner', className);

	return (
		<div className={block({type})}>
			<Svg icon="info" className={element('icon', {type})} />
			<div className={element('content')}>
				{title != null && <h3 className={element('title')}>{title}</h3>}
				{message != null &&
					(typeof message === 'string' ? (
						<p className={element('message')}>{message}</p>
					) : (
						<div className={element('message')}>{message}</div>
					))}
				{actionText != null && onAction != null && (
					<Button className={element('action')} theme="no-border" type="button" width="auto" onClick={onAction}>
						{actionText}
					</Button>
				)}
			</div>
		</div>
	);
};
