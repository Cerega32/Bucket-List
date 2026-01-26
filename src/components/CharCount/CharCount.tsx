import {FC} from 'react';

import {useBem} from '@/hooks/useBem';

import './char-count.scss';

interface CharCountProps {
	className?: string;
	current: number;
	max: number;
}

export const CharCount: FC<CharCountProps> = (props) => {
	const {className, current, max} = props;

	const [block, element] = useBem('char-count', className);
	const isError = current >= max;

	return (
		<div className={block()}>
			<span className={element('text', {error: isError})}>
				{current}/{max}
			</span>
		</div>
	);
};
