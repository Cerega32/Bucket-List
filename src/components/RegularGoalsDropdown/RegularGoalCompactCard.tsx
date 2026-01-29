import {FC} from 'react';

import {useBem} from '@/hooks/useBem';
import {IRegularGoalStatistics} from '@/typings/goal';
import {pluralize} from '@/utils/text/pluralize';

import {Line} from '../Line/Line';
import {Svg} from '../Svg/Svg';

interface RegularGoalCompactCardProps {
	statistics: IRegularGoalStatistics;
	onQuickComplete: () => void;
}

type RegularDayState = 'completed' | 'active' | 'inactive' | 'blocked';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const getCurrentDayOfWeek = (): number => {
	const today = new Date();
	const day = today.getDay();
	return day === 0 ? 6 : day - 1;
};

const getSeriesText = (statistics: IRegularGoalStatistics): string => {
	const value = statistics.currentStreak || 0;
	const isWeekly = statistics.currentPeriodProgress?.type === 'weekly';

	if (isWeekly) {
		return pluralize(value, ['неделя', 'недели', 'недель']);
	}

	return pluralize(value, ['день', 'дня', 'дней']);
};

const getWeekDayState = (statistics: IRegularGoalStatistics, index: number): RegularDayState => {
	const progress = statistics.currentPeriodProgress as any;
	if (!progress) return 'inactive';

	const currentDayIndex = getCurrentDayOfWeek();
	const weekDays = Array.isArray(progress.weekDays) ? progress.weekDays : null;

	if (weekDays && weekDays.length > 0) {
		const dayData = weekDays.find(
			(d: {dayIndex: number; isCompleted?: boolean; isBlocked?: boolean; isBlockedByStartDate?: boolean; isSkipped?: boolean}) =>
				d.dayIndex === index
		);

		if (!dayData) return 'inactive';

		const isBlockedByStartDate = dayData.isBlockedByStartDate || false;
		const isBlocked = dayData.isBlocked || false;
		const isCompleted = !isBlockedByStartDate && (dayData.isCompleted || false);
		const isSkipped = !isBlockedByStartDate && (dayData.isSkipped || false);
		const isCurrent = index === currentDayIndex;

		if (isCompleted || isSkipped) {
			return 'completed';
		}

		if (isBlocked && !isBlockedByStartDate) {
			return 'blocked';
		}

		if (isCurrent && !isBlockedByStartDate) {
			return 'active';
		}

		return 'inactive';
	}

	if (progress.type === 'daily') {
		if (index !== currentDayIndex) return 'inactive';
		return progress.completedToday ? 'completed' : 'active';
	}

	if (progress.type === 'weekly') {
		const required = progress.requiredPerWeek || 1;
		const completed = progress.currentWeekCompletions || 0;

		if (index < completed) return 'completed';
		if (index < required) return 'active';
		return 'inactive';
	}

	return 'inactive';
};

export const RegularGoalCompactCard: FC<RegularGoalCompactCardProps> = ({statistics, onQuickComplete}) => {
	const [block, element] = useBem('regular-goal-compact-card');
	const currentDayIndex = getCurrentDayOfWeek();
	const isCompletedToday = statistics.currentPeriodProgress?.completedToday ?? false;
	const goalData = statistics.regularGoalData;

	return (
		<div className={block()}>
			<div className={element('image-wrapper')}>
				<img src={goalData.goalImage} alt={goalData.goalTitle} className={element('image')} />
			</div>
			<div className={element('content')}>
				<h4 className={element('title')}>{goalData.goalTitle}</h4>
				<div className={element('days-row')}>
					<div className={element('days')}>
						{WEEK_DAYS.map((day, index) => {
							const state = getWeekDayState(statistics, index);
							const isToday = index === currentDayIndex;
							const isCompleted = state === 'completed';
							const isBlocked = state === 'blocked';
							const isSelected = state === 'active' || (isBlocked && isToday);

							return (
								<div
									key={day}
									className={element('day', {
										selected: isSelected && !isCompleted,
										blocked: isBlocked,
										completed: isCompleted,
									})}
									title={day}
								>
									{isCompleted && <Svg icon="done" className={element('day-icon')} />}
									{!isCompleted && isBlocked && <Svg icon="cross" className={element('day-icon')} />}
								</div>
							);
						})}
					</div>
					<Line vertical className={element('line')} />
					<span className={element('duration')}>{getSeriesText(statistics)}</span>
				</div>
			</div>
			<button
				type="button"
				className={element('action-button', {completed: isCompletedToday})}
				onClick={onQuickComplete}
				aria-label={isCompletedToday ? 'Отменить выполнение' : 'Быстро выполнить'}
			>
				<Svg icon={isCompletedToday ? 'regular' : 'regular-empty'} className={element('action-icon')} />
			</button>
		</div>
	);
};
