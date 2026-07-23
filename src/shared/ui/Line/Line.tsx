import {FC} from 'react';

import {useBem} from '@/shared/lib/hooks/useBem';
import '@/shared/ui/Line/line.scss';

interface LineProps {
	className?: string;
	vertical?: boolean;
	margin?: string;
	height?: number;
}

export const Line: FC<LineProps> = (props) => {
	const {className, vertical, margin, height = 0} = props;

	const [block, element] = useBem('line', className);

	return vertical ? (
		<div className={element('vertical-wrap')}>
			<div className={block({vertical})} style={{margin, height: `calc(100% + ${height}px)`}} />
		</div>
	) : (
		<hr className={block()} style={{margin}} />
	);
};
