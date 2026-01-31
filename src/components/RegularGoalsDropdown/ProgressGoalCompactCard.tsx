import {FC} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {IGoalProgress} from '@/utils/api/goals';

import {Line} from '../Line/Line';
import {Progress} from '../Progress/Progress';
import {Svg} from '../Svg/Svg';

interface ProgressGoalCompactCardProps {
	progress: IGoalProgress;
	onMarkToday: () => void;
	onChangeProgress: () => void;
}

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const getCurrentDayOfWeek = (): number => {
	const today = new Date();
	const day = today.getDay();
	return day === 0 ? 6 : day - 1;
};

type DayState = 'completed' | 'active' | 'inactive';

const formatLocalDate = (d: Date): string => {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
};

const getProgressWeekDayState = (progress: IGoalProgress, index: number): DayState => {
	const currentDayIndex = getCurrentDayOfWeek();
	const entries = progress.recentEntries || progress.entries || [];
	const entryDates = new Set(entries.map((e) => e.date.split('T')[0]));

	const now = new Date();
	const startOfWeek = new Date(now);
	startOfWeek.setDate(now.getDate() - ((now.getDay() || 7) - 1));
	const dayDate = new Date(startOfWeek);
	dayDate.setDate(startOfWeek.getDate() + index);
	const dateStr = formatLocalDate(dayDate);

	const hasEntry = entryDates.has(dateStr);
	const isToday = index === currentDayIndex;

	if (hasEntry) return 'completed';
	if (isToday && progress.isWorkingToday) return 'active';
	if (isToday) return 'active';
	return 'inactive';
};

export const ProgressGoalCompactCard: FC<ProgressGoalCompactCardProps> = ({progress, onMarkToday, onChangeProgress}) => {
	const [block, element] = useBem('progress-goal-compact-card');
	const currentDayIndex = getCurrentDayOfWeek();

	const handleMarkClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onMarkToday();
	};

	const handleChangeClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onChangeProgress();
	};

	return (
		<div className={block()}>
			<Link to={`/goals/${progress.goalCode}`} className={element('link-area')}>
				<div className={element('image-wrapper')}>
					<img src={progress.goalImage} alt={progress.goalTitle} className={element('image')} />
				</div>
				<div className={element('content')}>
					<h4 className={element('title')}>{progress.goalTitle}</h4>
					<div className={element('days-row')}>
						<div className={element('days')}>
							{WEEK_DAYS.map((day, index) => {
								const state = getProgressWeekDayState(progress, index);
								const isToday = index === currentDayIndex;
								const isCompleted = state === 'completed';
								const isSelected = isToday ? !isCompleted : state === 'active';

								return (
									<div
										key={day}
										className={element('day', {
											selected: isSelected,
											completed: isCompleted,
										})}
										title={day}
									>
										{isCompleted && <Svg icon="done" className={element('day-icon')} />}
									</div>
								);
							})}
						</div>
						<Line vertical className={element('line')} />
						<div className={element('duration')}>
							<Progress
								done={Math.round(progress.progressPercentage)}
								all={100}
								goal
								variant="bar-plain"
								className={element('progress')}
							/>
						</div>
					</div>
				</div>
			</Link>
			<div className={element('action-buttons')}>
				<button
					type="button"
					className={element('action-button', {change: true})}
					onClick={handleChangeClick}
					aria-label="Изменить прогресс"
					title="Изменить прогресс"
				>
					<Svg icon="signal" className={element('action-icon')} />
				</button>
				<button
					type="button"
					className={element('action-button', {completed: progress.isWorkingToday})}
					onClick={handleMarkClick}
					aria-label={progress.isWorkingToday ? 'Снять отметку' : 'Отметить сегодня'}
					title={progress.isWorkingToday ? 'Снять отметку' : 'Отметить сегодня'}
				>
					<Svg icon={progress.isWorkingToday ? 'regular' : 'regular-empty'} className={element('action-icon')} />
				</button>
			</div>
		</div>
	);
};
