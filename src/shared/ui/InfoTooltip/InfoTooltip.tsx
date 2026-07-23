import {FC, ReactNode, useCallback, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

import {useBem} from '@/shared/lib/hooks/useBem';
import {Svg} from '@/shared/ui/Svg/Svg';

import '@/shared/ui/InfoTooltip/info-tooltip.scss';

interface InfoTooltipProps {
	className?: string;
	paragraphs?: Array<string>;
	children?: ReactNode;
	iconWidth?: number;
	iconHeight?: number;
}

interface TooltipCoords {
	top: number;
	left: number;
}

export const InfoTooltip: FC<InfoTooltipProps> = (props) => {
	const {className, paragraphs, children, iconWidth = 13, iconHeight = 13} = props;
	const [block, element] = useBem('info-tooltip', className);
	const anchorRef = useRef<HTMLSpanElement>(null);
	const [coords, setCoords] = useState<TooltipCoords | null>(null);

	const showTooltip = useCallback(() => {
		const rect = anchorRef.current?.getBoundingClientRect();
		if (!rect) {
			return;
		}

		setCoords({
			top: rect.top,
			left: rect.left + rect.width / 2,
		});
	}, []);

	const hideTooltip = useCallback(() => {
		setCoords(null);
	}, []);

	const tooltipContent = coords ? (
		<div className={element('content', {fixed: true})} style={{top: coords.top, left: coords.left}} role="tooltip">
			{children}
			{paragraphs?.map((text) => (
				<p className={element('text')} key={text}>
					{text}
				</p>
			))}
		</div>
	) : null;

	return (
		<span
			ref={anchorRef}
			className={block()}
			tabIndex={0}
			role="button"
			aria-label="Подробнее"
			onMouseEnter={showTooltip}
			onMouseLeave={hideTooltip}
			onFocus={showTooltip}
			onBlur={hideTooltip}
		>
			<Svg icon="info" className={element('icon')} width={String(iconWidth)} height={String(iconHeight)} />
			{tooltipContent && createPortal(tooltipContent, document.body)}
		</span>
	);
};
