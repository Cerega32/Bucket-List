import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IShortGoal} from '@/typings/goal';

import {Card} from '../Card/Card';
import './list-goals.scss';

interface ListGoalsProps {
	className?: string;
	horizontal?: boolean;
	list: Array<IShortGoal>;
	columns?: 'two' | 'three' | 'four';
	updateGoal: (code: string, i: number, operation: 'add' | 'delete' | 'mark', done?: boolean) => Promise<void>;
}

export const ListGoals: FC<ListGoalsProps> = (props) => {
	const {className, list, horizontal, columns = 'three', updateGoal} = props;

	const [block, element] = useBem('list', className);

	return (
		<section className={block()}>
			{list.map((goal, i) => (
				<Card
					key={goal.code}
					goal={goal}
					className={element('goal', {columns})}
					horizontal={horizontal}
					onClickAdd={() => updateGoal(goal.code, i, 'add')}
					onClickDelete={() => updateGoal(goal.code, i, 'delete')}
					onClickMark={() => {
						return updateGoal(goal.code, i, 'mark', goal.completedByUser);
					}}
				/>
			))}
		</section>
	);
};
