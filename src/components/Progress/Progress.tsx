import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import './progress.scss';

export type ProgressVariant = 'bar' | 'bar-plain' | 'numbers';

interface ProgressProps {
	className?: string;
	done: number;
	all: number;
	goal?: boolean;
	text?: string;
	/** 'bar' — полоса + цифры с обводкой, 'bar-plain' — полоса + цифры без обводки, 'numbers' — только цифры */
	variant?: ProgressVariant;
}

export const Progress: FC<ProgressProps> = (props) => {
	const {className, done, all, goal, text, variant = 'bar'} = props;

	const [block, element] = useBem('progress', className);

	const percent = Math.round((done / (all || 1)) * 100);

	const countContent = goal ? `${percent}%` : text || `${done}/${all}`;

	if (variant === 'numbers') {
		return (
			<div className={block({goal, text: !!text, numbers: true})}>
				<span className={element('count')}>{countContent}</span>
			</div>
		);
	}

	const isBarPlain = variant === 'bar-plain';
	const blockModifiers = isBarPlain ? {text: !!text, barPlain: true} : {goal, text: !!text};

	return (
		<div className={block(blockModifiers)}>
			{!goal && !text && <span className={element('count')}>{`${done}/${all}`}</span>}
			<div className={element('line')}>
				<div className={element('line-done', {all: all === done})} style={{width: `${percent}%`}} />
			</div>
			{text && <span className={element('count')}>{text}</span>}
			{goal && <span className={element('count')}>{`${percent}%`}</span>}
		</div>
	);
};
