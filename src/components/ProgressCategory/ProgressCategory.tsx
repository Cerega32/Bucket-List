import {FC, useEffect, useRef} from 'react';

import {Svg} from '../Svg/Svg';

import {useBem} from '@/hooks/useBem';
import './progress-category.scss';
import {IComplexity} from '@/typings/goal';
import {getComplexityCategory} from '@/utils/values/complexity';

interface ProgressCategoryProps {
	className?: string;
	done: number;
	all: number;
	complexity: IComplexity;
}

export const ProgressCategory: FC<ProgressCategoryProps> = (props) => {
	const {className, done, all, complexity} = props;

	const [block, element] = useBem('progress-category', className);

	const progressRef = useRef<SVGCircleElement | null>(null);

	useEffect(() => {
		if (progressRef.current) {
			const circumference = 2 * Math.PI * parseFloat(progressRef.current.getAttribute('r') || '0');
			const offset = circumference - (circumference * (done / all) * 100) / 100;
			progressRef.current.style.strokeDashoffset = offset.toString();
		}
	}, [done, all]);

	return (
		<div className={block()}>
			<div className={element('bar')} style={{width: '40px', height: '40px'}}>
				<Svg icon={complexity} />
				<svg viewBox="0 0 40 40" className={element('svg-container')}>
					<circle className={element('outer-circle')} cx="20" cy="20" r="18" fill="none" strokeWidth={4} />
					{done && (
						<circle
							className={element('progress-indicator', {complexity})}
							cx="20"
							cy="20"
							r="18"
							fill="none"
							strokeWidth={4}
							ref={progressRef}
							strokeDasharray={`${2 * Math.PI * 17.5}`}
							strokeDashoffset="0"
							strokeLinecap="round"
							transform="rotate(-90 20 20)"
						/>
					)}
				</svg>
			</div>
			<div className={element('wrapper')}>
				<span>{getComplexityCategory[complexity]}</span>
				<span className={element('account')}>{`${done}/${all}`}</span>
			</div>
		</div>
	);
};
