import {FC, ReactElement, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';

import {Svg} from '../Svg/Svg';

import './button.scss';

interface ButtonProps {
	className?: string;
	theme?: 'blue' | 'blue-light' | 'gray' | 'no-border' | 'green' | 'red' | 'gradient' | 'integrate' | 'no-active';
	width?: 'full' | 'auto';
	size?: 'small' | 'medium';
	children?: ReactElement | string | number;
	icon?: string;
	onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
	type?: 'button' | 'button-close' | 'Link';
	typeBtn?: 'button' | 'submit';
	href?: string;
	small?: boolean;
	hoverContent?: ReactElement | string | number;
	hoverIcon?: string;
	disabled?: boolean;
	loading?: boolean;
	refInner?: React.RefObject<HTMLButtonElement>;
	withBorder?: boolean;
}

export const Button: FC<ButtonProps> = (props) => {
	const {
		className,
		theme,
		icon,
		onClick,
		type,
		href = '',
		children,
		small,
		size,
		width = 'full',
		typeBtn = 'button',
		hoverContent,
		hoverIcon,
		disabled,
		loading,
		refInner,
		withBorder,
	} = props;

	const [block, element] = useBem('button', className);
	const [text, setText] = useState(children);
	const [iconState, setIconState] = useState(icon);

	const onHover = (hover: boolean): void => {
		if (hoverContent || hoverIcon) {
			if (hover) {
				setIconState(hoverIcon);
				setText(hoverContent);
			} else {
				setIconState(icon);
				setText(children);
			}
		}
	};

	useEffect(() => {
		setIconState(icon);
		setText(children);
	}, [children, icon]);

	const createRipple = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
		const target = event.currentTarget as HTMLElement;
		if (!target) return;

		const ripple = document.createElement('span');
		const diameter = Math.max(target.clientWidth, target.clientHeight);
		const radius = diameter / 2;

		ripple.style.width = ripple.style.height = `${diameter}px`;
		ripple.style.left = `${event.clientX - target.getBoundingClientRect().left - radius}px`;
		ripple.style.top = `${event.clientY - target.getBoundingClientRect().top - radius}px`;
		ripple.classList.add('button__ripple');

		// Удаляем предыдущие волны
		const existingRipple = target.getElementsByClassName('ripple')[0];
		if (existingRipple) {
			existingRipple.remove();
		}

		target.appendChild(ripple);

		// Автоматически удалить ripple после завершения анимации
		setTimeout(() => ripple.remove(), 800);
	};

	const handleClickButton = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (disabled || loading) return;
		createRipple(e);
		onClick?.(e);
	};

	const handleClickLink = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		if (disabled) {
			e.preventDefault();
			return;
		}
		createRipple(e);
		onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement, MouseEvent>);
	};

	const content = (
		<>
			{!loading && iconState && <Svg width="16px" height="16px" icon={iconState} className={element('icon')} />}
			{loading && <span className={element('loading')} />}
			{loading ? !iconState : text}
		</>
	);

	const getType = () => {
		switch (type) {
			case 'Link':
				return (
					<Link to={href} className={block({theme, small, size, disabled, width})} onClick={handleClickLink}>
						{content}
						{theme === 'gradient' && <div className={element('gradient-shadow')} />}
					</Link>
				);
			case 'button-close':
				return (
					<button
						className={block({close: true, withBorder})}
						onClick={handleClickButton}
						type="button"
						disabled={disabled}
						ref={refInner}
						aria-label="закрыть"
					>
						<Svg icon="cross" width="20px" height="20px" />
					</button>
				);
			case 'button':
			default:
				return (
					<button
						className={block({theme, small, size, disabled, width})}
						onClick={handleClickButton}
						type={typeBtn === 'button' ? 'button' : 'submit'}
						onMouseEnter={() => onHover(true)}
						onMouseLeave={() => onHover(false)}
						disabled={disabled}
						ref={refInner}
					>
						{content}
						{theme === 'gradient' && <div className={element('gradient-shadow')} />}
					</button>
				);
		}
	};

	return getType();
};
