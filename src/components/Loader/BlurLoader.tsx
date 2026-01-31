import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import './loader.scss';

interface BlurLoaderProps {
	active: boolean;
	children?: React.ReactNode;
	className?: string;
	isPageBlur?: boolean;
}

// Компонент "блюра" на основе Loader: без спиннера, только размытие контента.
export const BlurLoader: FC<BlurLoaderProps> = ({active, children, className, isPageBlur}) => {
	const [block, element] = useBem('loader', className);

	if (!active && !children) return null;

	return (
		<div className={block({page: isPageBlur})}>
			{children && <div className={element('content', {blurred: active, page: isPageBlur})}>{children}</div>}

			{active && <div className={element('overlay', {page: isPageBlur, transparent: true})} />}
		</div>
	);
};
