import {FC, ReactElement} from 'react';

import {useBem} from '@/hooks/useBem';
import './gradient.scss';

/** Заглушка, если с бэкенда `image: null` или пустая строка (файл в `public/assets/`) */
export const GRADIENT_DEFAULT_IMAGE = '/assets/img-default.png';

interface GradientProps {
	className?: string;
	img: {src: string | null | undefined; alt: string};
	children?: ReactElement;
	category: string;
	show?: boolean;
	blacked?: boolean;
	withoutBlack?: boolean;
	withBlack?: boolean;
	topInfoClassName?: string;
}

export const Gradient: FC<GradientProps> = (props) => {
	const {className, img, children, category, show = true, blacked, withoutBlack, withBlack, topInfoClassName} = props;

	const [block, element] = useBem('gradient', className);

	const imageSrc = img.src != null && String(img.src).trim() !== '' ? String(img.src).trim() : GRADIENT_DEFAULT_IMAGE;

	return (
		<div className={block()}>
			<img src={imageSrc} alt={img.alt} className={element('img', {blacked})} />
			<div className={element('color', {category, show, blacked, withoutBlack, withBlack})} />
			<div className={`${element('top-info')} ${topInfoClassName || ''}`.trim()}>{children}</div>
		</div>
	);
};
