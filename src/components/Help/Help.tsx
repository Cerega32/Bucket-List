import {FC, ReactElement} from 'react';

import {useBem} from '@/hooks/useBem';

import './help.scss';

interface HelpProps {
	className?: string;
	content: ReactElement;
}

export const Help: FC<HelpProps> = (props) => {
	const {className, content} = props;

	const [block, element] = useBem('help', className);

	return (
		<section className={block()}>
			<span className={element('icon')}>?</span>
			<div className={element('content')}>{content}</div>
		</section>
	);
};
