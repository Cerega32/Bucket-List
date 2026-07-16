import {CSSProperties, FC} from 'react';

import {useBem} from '@/hooks/useBem';

import './skeleton.scss';

interface SkeletonProps {
	className?: string;
	width?: number | string;
	height?: number | string;
	borderRadius?: number | string;
	circle?: boolean;
	inline?: boolean;
	style?: CSSProperties;
}

export const Skeleton: FC<SkeletonProps> = (props) => {
	const {className, width, height, borderRadius, circle, inline, style} = props;
	const [block] = useBem('skeleton', className);

	const mergedStyle: CSSProperties = {
		width,
		height,
		borderRadius: circle ? '50%' : borderRadius,
		...style,
	};

	return <span className={block({circle, inline})} style={mergedStyle} aria-hidden="true" />;
};
