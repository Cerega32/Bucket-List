import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './info-goal.scss';
import {getComplexity} from '@/utils/values/complexity';

interface InfoGoalProps {
	className?: string;
	complexity: string;
	totalAdded: number;
	totalCompleted: number;
}

export const InfoGoal: FC<InfoGoalProps> = (props) => {
	const {className, totalCompleted, totalAdded, complexity} = props;

	const [block, element] = useBem('info-goal', className);

	return (
		<section className={block()}>
			<div className={element('item')}>
				<span className={element('title')}>Сложность</span>
				<span className={element('text')}>
					{getComplexity[complexity]}
				</span>
			</div>
			<div className={element('vertical-line')} />
			<div className={element('item')}>
				<span className={element('title')}>Людей взяли</span>
				<span className={element('text')}>{totalAdded}</span>
			</div>
			<div className={element('vertical-line')} />
			<div className={element('item')}>
				<span className={element('title')}>Выполнили</span>
				<span className={element('text')}>{totalCompleted}</span>
			</div>
			<div className={element('vertical-line')} />
			<div className={element('item')}>
				<span className={element('title')}>Процент выполнения</span>
				<span className={element('text')}>
					{Math.round((totalCompleted / totalAdded) * 100)}%
				</span>
			</div>
		</section>
	);
};
