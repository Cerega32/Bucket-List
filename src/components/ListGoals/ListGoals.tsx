import {FC, useEffect, useState} from 'react';

import {useBem} from '@/hooks/useBem';
import {IShortGoal} from '@/typings/goal';

import {Card} from '../Card/Card';
import {FieldCheckbox} from '../FieldCheckbox/FieldCheckbox';
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
	const [hideCompleted, setHideCompleted] = useState(false);
	const [filteredList, setFilteredList] = useState<IShortGoal[]>([]);

	const [block, element] = useBem('list', className);

	useEffect(() => {
		setFilteredList(hideCompleted ? list.filter((goal) => !goal.completedByUser) : list);
	}, [hideCompleted, list]);

	const handleGoalUpdate = async (code: string, _: number, operation: 'add' | 'delete' | 'mark', done?: boolean) => {
		// Находим индекс в оригинальном списке
		const originalIndex = list.findIndex((goal) => goal.code === code);
		if (originalIndex !== -1) {
			await updateGoal(code, originalIndex, operation, done);
		}
	};

	return (
		<section className={block()}>
			<div className={element('filter')}>
				<FieldCheckbox id="hide-completed" text="Скрыть выполненные" checked={hideCompleted} setChecked={setHideCompleted} />
			</div>
			<div className={element('grid', {columns})}>
				{filteredList.map((goal, i) => (
					<Card
						key={goal.code}
						goal={goal}
						className={element('goal')}
						horizontal={horizontal}
						onClickAdd={() => handleGoalUpdate(goal.code, i, 'add')}
						onClickDelete={() => handleGoalUpdate(goal.code, i, 'delete')}
						onClickMark={() => {
							return handleGoalUpdate(goal.code, i, 'mark', goal.completedByUser);
						}}
					/>
				))}
			</div>
		</section>
	);
};
