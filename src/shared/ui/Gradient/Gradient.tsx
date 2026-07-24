import {FC, ReactElement} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import '@/shared/ui/Gradient/gradient.scss';

/** Заглушка, если с бэкенда `image: null` или пустая строка (файл в `public/assets/`) */
export const GRADIENT_DEFAULT_IMAGE = '/assets/img-default.png';

export const resolveGoalImageSrc = (src?: string | null): string => {
	if (src != null && String(src).trim() !== '') {
		return String(src).trim();
	}
	return GRADIENT_DEFAULT_IMAGE;
};

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

	const imageSrc = resolveGoalImageSrc(img.src);

	return (
		<div className={block()}>
			<img src={imageSrc} alt={img.alt} className={element('img', {blacked})} />
			<div className={element('color', {category, show, blacked, withoutBlack, withBlack})} />
			<div className={`${element('top-info')} ${topInfoClassName || ''}`.trim()}>{children}</div>
		</div>
	);
};
