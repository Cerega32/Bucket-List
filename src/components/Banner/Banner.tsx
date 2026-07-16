import React, {ReactNode} from 'react';

import {useBem} from '@/hooks/useBem';

import {Button} from '../Button/Button';
import {Svg} from '../Svg/Svg';

import './banner.scss';

export type BannerType = 'success' | 'info' | 'warning' | 'danger' | 'gold';
export type BannerVariant = 'default' | 'filled';
export type BannerSize = 'default' | 'large';
export type BannerIconVariant = 'default' | 'target';

export interface BannerProps {
	type: BannerType;
	variant?: BannerVariant;
	size?: BannerSize;
	title?: string;
	message?: string | ReactNode;
	actionText?: string;
	onAction?: () => void;
	icon?: ReactNode | null;
	iconVariant?: BannerIconVariant;
	endContent?: ReactNode;
	className?: string;
}

export const Banner: React.FC<BannerProps> = (props) => {
	const {
		type,
		variant = 'default',
		size = 'default',
		title,
		message,
		actionText,
		onAction,
		icon,
		iconVariant = 'default',
		endContent,
		className,
	} = props;
	const [block, element] = useBem('banner', className);

	const isFilled = variant === 'filled';
	const hasAction = actionText != null && onAction != null;

	const renderIcon = () => {
		if (icon === null) {
			return null;
		}

		if (icon !== undefined) {
			return <div className={element('icon', {custom: true})}>{icon}</div>;
		}

		if (iconVariant === 'target') {
			return (
				<div className={element('icon-target')}>
					<img src="/assets/achievements/target-default.svg" alt="" className={element('icon-target-image')} />
				</div>
			);
		}

		return <Svg icon="info" className={element('icon', {type})} />;
	};

	const renderTitle = () => (title != null ? <h3 className={element('title')}>{title}</h3> : null);

	const renderMessage = () => {
		if (message == null) {
			return null;
		}

		return typeof message === 'string' ? (
			<p className={element('message')}>{message}</p>
		) : (
			<div className={element('message')}>{message}</div>
		);
	};

	const renderAction = () =>
		hasAction ? (
			<Button className={element('action')} theme="no-border" type="button" width="auto" onClick={onAction}>
				{actionText}
			</Button>
		) : null;

	return (
		<div
			className={block({
				type,
				variant: isFilled ? 'filled' : undefined,
				size: size === 'large' ? 'large' : undefined,
				'with-end': Boolean(endContent),
			})}
		>
			{renderIcon()}
			<div className={element('content')}>
				{isFilled ? (
					<>
						<div className={element('text')}>
							{renderTitle()}
							{renderMessage()}
						</div>
						{renderAction()}
					</>
				) : (
					<>
						{renderTitle()}
						{renderMessage()}
						{renderAction()}
					</>
				)}
			</div>
			{endContent != null && <div className={element('end')}>{endContent}</div>}
		</div>
	);
};
