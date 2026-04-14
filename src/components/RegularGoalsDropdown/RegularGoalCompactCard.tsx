import {FC, useState} from 'react';
import {Link} from 'react-router-dom';

import {useBem} from '@/hooks/useBem';
import {IRegularGoalStatistics} from '@/typings/goal';
import {pluralize} from '@/utils/text/pluralize';

import {Line} from '../Line/Line';
import {Svg} from '../Svg/Svg';

interface RegularGoalCompactCardProps {
	statistics: IRegularGoalStatistics;
	onQuickComplete: (regularGoalId: number, currentlyCompleted: boolean) => void;
	onRestart: (regularGoalId: number) => void;
}

type RegularDayState = 'completed' | 'completedBg' | 'allowedSkip' | 'active' | 'inactive' | 'blocked';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const REGULAR_CUSTOM_DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const getCurrentDayOfWeek = (): number => {
	const today = new Date();
	const day = today.getDay();
	return day === 0 ? 6 : day - 1;
};

const getSeriesText = (statistics: IRegularGoalStatistics): string => {
	const frequency = statistics.regularGoalData?.frequency;
	const isWeeklyUnit = frequency !== 'daily';
	let value = statistics.currentStreak || 0;

	if (statistics.isSeriesCompleted) {
		if (isWeeklyUnit) {
			value = statistics.completedWeeks > 0 ? statistics.completedWeeks : value;
		} else {
			value = statistics.totalCompletions > 0 ? statistics.totalCompletions : value;
		}
	} else if (isWeeklyUnit) {
		value = statistics.completedWeeks > 0 ? statistics.completedWeeks : value;
	}

	const units = isWeeklyUnit ? ['неделя', 'недели', 'недель'] : ['день', 'дня', 'дней'];
	return pluralize(value, units as [string, string, string]);
};

const getWeekDayState = (statistics: IRegularGoalStatistics, index: number): RegularDayState => {
	const progress = statistics.currentPeriodProgress as any;
	if (!progress) return 'inactive';

	const currentDayIndex = getCurrentDayOfWeek();
	const weekDays = Array.isArray(progress.weekDays) ? progress.weekDays : null;

	if (weekDays && weekDays.length > 0) {
		const dayData = weekDays.find(
			(d: {
				dayIndex: number;
				isCompleted?: boolean;
				isCompletedDay?: boolean;
				isBlocked?: boolean;
				isBlockedByStartDate?: boolean;
				isSkipped?: boolean;
			}) => d.dayIndex === index
		);

		if (!dayData) return 'inactive';

		const isBlockedByStartDate = dayData.isBlockedByStartDate || false;
		const isBlocked = dayData.isBlocked || false;
		const cs = statistics.regularGoalData?.customSchedule;
		let blockedCross = isBlocked && !isBlockedByStartDate;
		if (progress.type === 'custom' && cs && typeof cs === 'object') {
			const inSchedule = cs[REGULAR_CUSTOM_DAY_KEYS[index]] === true;
			blockedCross = !inSchedule || !!isBlocked;
		}
		const isCompletedBg = !isBlockedByStartDate && (dayData.isCompleted || false);
		const isCompletedActual = !isBlockedByStartDate && (dayData.isCompletedDay ?? dayData.isCompleted ?? false);
		const isSkipped = !isBlockedByStartDate && (dayData.isSkipped || false);
		const isCurrent = index === currentDayIndex;

		if (isSkipped) {
			return 'allowedSkip';
		}

		if (isCompletedActual) {
			return 'completed';
		}

		if (isCompletedBg) {
			return 'completedBg';
		}

		if (blockedCross) {
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

export const RegularGoalCompactCard: FC<RegularGoalCompactCardProps> = ({statistics, onQuickComplete, onRestart}) => {
	const [block, element] = useBem('regular-goal-compact-card');
	const [hovered, setHovered] = useState(false);
	const currentDayIndex = getCurrentDayOfWeek();
	const isSeriesInterrupted = statistics.isInterrupted ?? false;
	const goalData = statistics.regularGoalData;
	const progress = statistics.currentPeriodProgress as any;

	// Логика как в AsideGoal: для custom проверяем, заблокирован ли сегодня по расписанию
	const isBlockedBySchedule = (() => {
		if (progress?.type !== 'custom') return false;
		const weekDays = Array.isArray(progress.weekDays) ? progress.weekDays : null;
		if (!weekDays) return false;
		const todayData = weekDays.find((d: {dayIndex: number}) => d.dayIndex === currentDayIndex);
		return todayData?.isAllowed === false;
	})();

	// Для daily: completedToday; для weekly/custom: !canCompleteToday (если не заблокировано по расписанию)
	const isCompletedToday = isBlockedBySchedule
		? false
		: progress?.type === 'daily'
		? !!progress.completedToday
		: !(statistics.canCompleteToday ?? true);

	const actionIcon = isSeriesInterrupted
		? 'regular-empty'
		: isBlockedBySchedule
		? 'cross'
		: isCompletedToday && hovered
		? 'cross'
		: isCompletedToday
		? 'regular'
		: 'regular-empty';

	const handleActionClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (isBlockedBySchedule) return;
		if (isSeriesInterrupted) {
			onRestart(statistics.regularGoal);
		} else {
			onQuickComplete(statistics.regularGoal, isCompletedToday);
		}
	};

	return (
		<div className={block()}>
			<Link to={`/goals/${goalData.goalCode}`} className={element('link-area')}>
				<div className={element('image-wrapper')}>
					<img src={goalData.goalImage} alt={goalData.goalTitle} className={element('image')} />
				</div>
				<div className={element('content')}>
					<h4 className={element('title')}>{goalData.goalTitle}</h4>
					<div className={element('days-row')}>
						<div className={element('days', {interrupted: isSeriesInterrupted})}>
							{isSeriesInterrupted ? (
								<div className={element('interrupted')}>
									<Svg icon="regular-cancel" className={element('interrupted-icon')} />
									<span className={element('interrupted-text')}>Серия прервана</span>
								</div>
							) : (
								WEEK_DAYS.map((day, index) => {
									const state = getWeekDayState(statistics, index);
									const isToday = index === currentDayIndex;
									const isActuallyCompleted = state === 'completed';
									const isCompletedBg = state === 'completedBg';
									const isAllowedSkip = state === 'allowedSkip';
									const isBlocked = state === 'blocked';
									const showCompleted = isActuallyCompleted || isCompletedBg;
									const isSelected = state === 'active' || (isBlocked && isToday);

									return (
										<div
											key={day}
											className={element('day', {
												selected: isSelected && !showCompleted,
												blocked: isBlocked,
												completed: showCompleted,
												allowedSkip: isAllowedSkip,
											})}
											title={day}
										>
											{(isActuallyCompleted || isAllowedSkip) && <Svg icon="done" className={element('day-icon')} />}
											{!isActuallyCompleted && isBlocked && <Svg icon="cross" className={element('day-icon')} />}
										</div>
									);
								})
							)}
						</div>
						<Line vertical className={element('line')} />
						<span className={element('duration')}>{getSeriesText(statistics)}</span>
					</div>
				</div>
			</Link>
			<button
				type="button"
				className={element('action-button', {completed: isCompletedToday && !isSeriesInterrupted, blocked: isBlockedBySchedule})}
				onClick={handleActionClick}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				disabled={isBlockedBySchedule}
				aria-label={
					isBlockedBySchedule
						? 'Сегодня нельзя выполнить'
						: isSeriesInterrupted
						? 'Начать заново'
						: isCompletedToday
						? 'Отменить выполнение'
						: 'Быстро выполнить'
				}
			>
				<Svg icon={actionIcon} className={element('action-icon')} />
			</button>
		</div>
	);
};
