import {FC} from 'react';
import {ReactSVG} from 'react-svg';
import './svg.scss';
import {useBem} from '@/hooks/useBem';

interface SvgProps {
	icon: string;
	className?: string;
	width?: string;
	height?: string;
}

export const Svg: FC<SvgProps> = (props) => {
	const {icon, className, width = 'auto', height = 'auto'} = props;

	const iconAndDirection = icon.split('--');

	const [block] = useBem('svg', className);

	return (
		<ReactSVG
			src={`src/assets/svg/${iconAndDirection[0]}.svg`}
			className={block({direction: iconAndDirection[1]})}
			width={width}
			height={height}
		/>
	);
};
