import {FC, ReactElement} from 'react';
import {Link} from 'react-router-dom';
import {Svg} from '../Svg/Svg';
import {useBem} from '@/hooks/useBem';
import './button.scss';

interface ButtonProps {
	className?: string;
	theme?: 'blue' | 'blue-light' | 'no-border';
	size?: 'small';
	children: ReactElement | string | number;
	icon?: string;
	onClick?: () => void;
	type?: 'button' | 'Link';
	href?: string;
	small?: boolean;
	method?: string;
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
		method,
		size,
	} = props;

	const [block, element] = useBem('button', className);

	const content = (
		<>
			{icon && (
				<Svg
					width="16px"
					height="16px"
					icon={icon}
					className={element('icon')}
				/>
			)}
			{children}
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
						type="button"
						method={method}
					>
						{content}
					</button>
				);
		}
	};

	return getType();
};
