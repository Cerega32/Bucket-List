import {FC} from 'react';
import {ReactSVG} from 'react-svg';

import {useBem} from '@/hooks/useBem';
import './svg.scss';

interface SvgProps {
	icon: string;
	className?: string;
	width?: string;
	height?: string;
}

export const Svg: FC<SvgProps> = (props) => {
	const {icon, className, width = 'auto', height = 'auto'} = props;

	const iconAndTransform = icon.split('--');

	const [block] = useBem('svg', className);

	return (
		<ReactSVG
			wrapper="span"
			src={`/src/assets/svg/${iconAndTransform[0]}.svg`}
			className={block({
				transform: iconAndTransform[1],
			})}
			beforeInjection={(svg) => {
				svg.setAttribute('style', `width: ${width}; height: ${height}`);
			}}
		/>
	);
};
