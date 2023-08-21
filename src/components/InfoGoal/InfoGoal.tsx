import {FC} from 'react';
import {useBem} from '@/hooks/useBem';
import './info-goal.scss';
import {getComplexity} from '@/utils/values/complexity';
import {IComplexity} from '@/typings/goal';

interface InfoGoalProps {
	className?: string;
	complexity?: IComplexity;
	totalAdded: number;
	totalCompleted: number;
	isUser?: boolean;
}

export const InfoGoal: FC<InfoGoalProps> = (props) => {
	const {className, totalCompleted, totalAdded, complexity, isUser} = props;

	const [block, element] = useBem('info-goal', className);

	return (
		<section className={block()}>
			{complexity && (
				<div className={element('item')}>
					<span className={element('title')}>Сложность</span>
					<span className={element('text')}>
						{getComplexity[complexity]}
					</span>
				</div>
			)}
			<div className={element('vertical-line')} />
			<div className={element('item')}>
				<span className={element('title')}>
					{isUser ? 'Всего целей' : 'Людей взяли'}
				</span>
				<span className={element('text')}>{totalAdded}</span>
			</div>
			<div className={element('vertical-line')} />
			<div className={element('item')}>
				<span className={element('title')}>
					{isUser ? 'Выполнено' : 'Выполнили'}
				</span>
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
