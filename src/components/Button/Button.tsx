import {FC, ReactElement, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';
import './button.scss';

interface ButtonProps {
	className?: string;
	theme?: 'blue' | 'blue-light' | 'no-border' | 'green' | 'red';
	width?: 'auto';
	size?: 'small';
	children?: ReactElement | string | number;
	icon?: string;
	onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
	type?: 'button' | 'Link';
	typeBtn?: 'button' | 'submit';
	href?: string;
	small?: boolean;
	hoverContent?: ReactElement | string | number;
	hoverIcon?: string;
	active?: boolean;
	loading?: boolean;
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
		typeBtn = 'button',
		hoverContent,
		hoverIcon,
		active,
		loading,
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
					<Link to={href} className={block({theme, small, size, active})}>
						{content}
					</Link>
				);
			case 'button':
			default:
				return (
					<button
						className={block({theme, small, size, active})}
						onClick={onClick}
						type={typeBtn === 'button' ? 'button' : 'submit'}
						onMouseEnter={() => onHover(true)}
						onMouseLeave={() => onHover(false)}
						disabled={active}
					>
						{content}
					</button>
				);
		}
	};

	return getType();
};
