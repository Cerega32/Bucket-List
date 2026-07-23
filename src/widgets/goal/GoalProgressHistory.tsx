import {observer} from 'mobx-react-lite';
import {FC, useEffect, useRef, useState} from 'react';

import {IGoalProgressEntry, getGoalProgressEntries} from '@/entities/goal/api/goals';
import {isPremiumSubscriptionActive} from '@/entities/regular-goal/lib/checkRegularGoalsAddLimit';
import {UserStore} from '@/entities/user/model/UserStore';
import {EditProgressEntryNotesModal} from '@/features/edit-progress-entry-notes/EditProgressEntryNotesModal';
import {useBem} from '@/shared/lib/hooks/useBem';
import {formatDateString} from '@/shared/lib/time/formatDate';
import {Button} from '@/shared/ui/Button/Button';
import {EmptyState} from '@/shared/ui/EmptyState/EmptyState';
import {GoalProgressHistorySkeleton} from '@/widgets/goal/GoalProgressHistorySkeleton';
import '@/widgets/goal/goal-progress-history.scss';

interface GoalProgressHistoryProps {
	className?: string;
	goalId: number;
	refreshTrigger?: number;
}

export const GoalProgressHistory: FC<GoalProgressHistoryProps> = observer(({className, goalId, refreshTrigger}) => {
	const [block, element] = useBem('goal-progress-history', className);
	const [entries, setEntries] = useState<IGoalProgressEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [multilineMap, setMultilineMap] = useState<Record<number, boolean>>({});
	const [editingEntry, setEditingEntry] = useState<IGoalProgressEntry | null>(null);
	const noteRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const canEditNotes = isPremiumSubscriptionActive(UserStore.userSelf);

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

	const recalcMultiline = () => {
		const newMap: Record<number, boolean> = {};

		entries.forEach((entry) => {
			const el = noteRefs.current[entry.id];
			if (el) {
				const style = window.getComputedStyle(el);
				const lineHeight = parseFloat(style.lineHeight);
				const height = el.clientHeight;

				if (!Number.isNaN(lineHeight) && lineHeight > 0) {
					newMap[entry.id] = height > lineHeight * 1.2;
				} else {
					newMap[entry.id] = false;
				}
			}
		});

		setMultilineMap(newMap);
	};

	useEffect(() => {
		recalcMultiline();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [entries]);

	const handleEntrySaved = (updated: IGoalProgressEntry) => {
		setEntries((prev) => prev.map((item) => (item.id === updated.id ? {...item, notes: updated.notes} : item)));
	};

	if (isLoading) {
		return (
			<div className={block()}>
				<GoalProgressHistorySkeleton />
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
						<li
							key={entry.id}
							className={element('item', {
								multiline: multilineMap[entry.id],
							})}
						>
							<span className={element('date')}>{dateStr}</span>
							<div
								className={element('note', {
									empty: !note,
								})}
								ref={(el) => {
									noteRefs.current[entry.id] = el;
								}}
							>
								{note || 'Заметка отсутствует'}
							</div>
							<div className={element('actions')}>
								{canEditNotes && (
									<Button
										icon="edit"
										theme="blue-light"
										width="auto"
										onClick={() => setEditingEntry(entry)}
										className={element('edit')}
									/>
								)}
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
							</div>
						</li>
					);
				})}
			</ul>

			<EditProgressEntryNotesModal
				isOpen={Boolean(editingEntry)}
				goalId={goalId}
				entry={editingEntry}
				onClose={() => setEditingEntry(null)}
				onSaved={handleEntrySaved}
			/>
		</div>
	);
});
