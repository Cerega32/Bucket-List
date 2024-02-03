import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import './line.scss';

interface LineProps {
	className?: string;
	vertical?: boolean;
	margin?: string;
	height?: number;
}

export const Line: FC<LineProps> = (props) => {
	const {className, vertical, margin, height = 0} = props;

	const [block] = useBem('line', className);

	return vertical ? (
		<div style={{display: 'flex', alignItems: 'center'}}>
			<div className={block({vertical})} style={{margin, height: `calc(100% + ${height}px)`}} />
		</div>
	) : (
		<hr className={block()} style={{margin}} />
	);
};
