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
	onClick?: () => void;
	type?: 'button' | 'Link';
	typeBtn?: 'button' | 'submit';
	href?: string;
	small?: boolean;
	hoverContent?: ReactElement | string | number;
	hoverIcon?: string;
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
			{iconState && (
				<Svg
					width="16px"
					height="16px"
					icon={iconState}
					className={element('icon')}
				/>
			)}
			{text}
		</>
	);

	const getType = () => {
		switch (type) {
			case 'Link':
				return (
					<Link to={href} className={block({theme, small, size})}>
						{content}
					</Link>
				);
			case 'button':
			default:
				return (
					<button
						className={block({theme, small, size})}
						onClick={onClick}
						type={typeBtn === 'button' ? 'button' : 'submit'}
						onMouseEnter={() => onHover(true)}
						onMouseLeave={() => onHover(false)}
					>
						{content}
					</button>
				);
		}
	};

	return getType();
};
