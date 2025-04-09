import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IShortGoal} from '@/typings/goal';

import {CardMain} from '../CardMain/CardMain';

import './popular-goals.scss';

interface PopularGoalsProps {
	className?: string;
	goals: IShortGoal[];
	onMarkComplete: (code: string, done: boolean) => Promise<void>;
}

export const PopularGoals: FC<PopularGoalsProps> = ({className, goals, onMarkComplete}) => {
	const [block, element] = useBem('popular-goals', className);

	const handleUpdateGoal = (code: string, done: boolean) => {
		onMarkComplete(code, done);
	};

	return (
		<div className={block()}>
			{goals.map((goal, index) => (
				<CardMain
					key={goal.code}
					goal={goal}
					className={element('card')}
					big={index < 2}
					withBtn
					updateGoal={() => handleUpdateGoal(goal.code, goal.completedByUser)}
				/>
			))}
		</div>
	);
};
