import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './progress.scss';

interface ProgressProps {
	className?: string;
	done: number;
	all: number;
	goal?: boolean;
}

export const Progress: FC<ProgressProps> = (props) => {
	const {className, done, all, goal} = props;

	const [block, element] = useBem('progress', className);

	return (
		<div className={block({goal})}>
			{!goal && (
				<span className={element('count')}>{`${done}/${all}`}</span>
			)}
			<div className={element('line')}>
				<div
					className={element('line-done', {all: all === done})}
					style={{width: `${Math.round((done / (all || 1)) * 100)}%`}}
				/>
			</div>
			{goal && (
				<span className={element('count')}>{`${Math.round(
					(done / (all || 1)) * 100
				)}%`}</span>
			)}
		</div>
	);
};
