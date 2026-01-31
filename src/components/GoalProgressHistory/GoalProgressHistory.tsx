import {observer} from 'mobx-react-lite';
import {FC, useEffect, useState} from 'react';

import {EmptyState} from '@/components/EmptyState/EmptyState';
import {Loader} from '@/components/Loader/Loader';
import {useBem} from '@/hooks/useBem';
import {IGoalProgressEntry, getGoalProgressEntries} from '@/utils/api/goals';
import {formatDateString} from '@/utils/time/formatDate';

import './goal-progress-history.scss';

interface GoalProgressHistoryProps {
	className?: string;
	goalId: number;
	refreshTrigger?: number;
}

export const GoalProgressHistory: FC<GoalProgressHistoryProps> = observer(({className, goalId, refreshTrigger}) => {
	const [block, element] = useBem('goal-progress-history', className);
	const [entries, setEntries] = useState<IGoalProgressEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
			try {
				const response = await getGoalProgressEntries(goalId);
				if (response.success && response.data?.results) {
					setEntries(response.data.results);
				} else {
					setEntries([]);
				}
			} catch {
				setEntries([]);
			} finally {
				setIsLoading(false);
			}
		};

		if (goalId) {
			load();
		}
	}, [goalId, refreshTrigger]);

	if (isLoading) {
		return (
			<div className={block()}>
				<Loader isLoading={isLoading} />
			</div>
		);
	}

	if (entries.length === 0) {
		return (
			<div className={block()}>
				<EmptyState
					title="История прогресса пуста"
					description="Заметки изменения прогресса появятся здесь после того, как вы начнёте выполнять цель и будете отмечать прогресс."
				/>
			</div>
		);
	}

	return (
		<div className={block()}>
			<ul className={element('list')}>
				{entries.map((entry) => {
					const change = entry.percentageChange ?? (entry as unknown as {percentage_change?: number}).percentage_change ?? 0;
					const note = entry.notes ?? '';
					const dateStr = entry.date ? formatDateString(entry.date) : '';

					return (
						<li key={entry.id} className={element('item')}>
							<span className={element('date')}>{dateStr}</span>
							<div className={element('note')}>{note || 'Заметка отсутствует'}</div>
							<span
								className={element('badge', {
									positive: change > 0,
									negative: change < 0,
									zero: change === 0,
								})}
							>
								{change > 0 ? '+' : ''}
								{change}%
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
});
