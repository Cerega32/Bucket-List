import {FC} from 'react';

import {Line} from '../Line/Line';
import {Progress} from '../Progress/Progress';

import {useBem} from '@/hooks/useBem';
import './info-goal.scss';
import {IComplexity} from '@/typings/goal';
import {getComplexity} from '@/utils/values/complexity';

interface InfoGoalProps {
	className?: string;
	complexity?: IComplexity;
	totalAdded: number;
	totalCompleted: number;
	isUser?: boolean;
	progress?: boolean;
	horizontal?: boolean;
}

export const InfoGoal: FC<InfoGoalProps> = (props) => {
	const {className, totalCompleted, totalAdded, complexity, isUser, progress, horizontal} = props;

	const [block, element] = useBem('info-goal', className);

	return (
		<section className={block({horizontal})}>
			<div className={element('wrapper')}>
				{complexity && (
					<>
						<div className={element('item')}>
							<span className={element('title')}>Сложность</span>
							<span className={element('text')}>{getComplexity[complexity]}</span>
						</div>
						<div className={element('vertical-line')} />
					</>
				)}
				{!horizontal && (
					<>
						<div className={element('item')}>
							<span className={element('title')}>{isUser ? 'Всего целей' : 'Добавили к себе'}</span>
							<span className={element('text')}>{totalAdded}</span>
						</div>
						<div className={element('vertical-line')} />
						<div className={element('item')}>
							<span className={element('title')}>{isUser ? 'Выполнено' : 'Выполнили'}</span>
							<span className={element('text')}>{totalCompleted}</span>
						</div>
					</>
				)}
				{!progress && (
					<>
						<div className={element('vertical-line')} />
						<div className={element('item')}>
							<span className={element('title')}>Процент выполнения</span>
							<span className={element('text')}>{Math.round((totalCompleted / totalAdded) * 100)}%</span>
						</div>
					</>
				)}
				{horizontal && (
					<div className={element('wrapper-horizontal')}>
						<span className={element('title')}>Мой прогресс выполнения</span>
						<span className={element('text')}>{`${totalCompleted}/${totalAdded}`}</span>
					</div>
				)}
			</div>
			{progress && totalAdded > 0 && (
				<>
					<Line vertical={horizontal} margin="5px 24px" height={-10} />
					<Progress done={totalCompleted} all={totalAdded} goal />
				</>
			)}
		</section>
	);
};
