import {FC, ReactElement} from 'react';

import {useBem} from '@/hooks/useBem';
import './gradient.scss';

interface GradientProps {
	className?: string;
	img: {src: string; alt: string};
	children?: ReactElement;
	category: string;
	show?: boolean;
	blacked?: boolean;
}

export const Gradient: FC<GradientProps> = (props) => {
	const {className, img, children, category, show = true, blacked} = props;

	const [block, element] = useBem('gradient', className);

	return (
		<div className={block()}>
			<img src={img.src} alt={img.alt} className={element('img', {blacked})} />
			<div className={element('color', {category, show, blacked})} />
			<div className={element('top-info')}>{children}</div>
		</div>
	);
};
